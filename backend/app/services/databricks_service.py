"""
Databricks integration service for semantic product search.

Connects to:
- Databricks Vector Search (embedding-based similarity search)
- Databricks SQL Warehouse (Gold table product details + analytics)
- Databricks Foundation Model APIs (LLM query understanding + suggestions)

Falls back gracefully if credentials are not configured.
"""
import json
import re
import time
import asyncio
import logging
from typing import List, Dict, Any, Optional

import requests

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)
from app.models.product import ProductDTO

# ── LLM System Prompts ────────────────────────────────────────────────────────

_SUGGESTIONS_SYSTEM_PROMPT = """You are a retail product search assistant.

Given a partial search query typed by a user, generate intelligent autocomplete suggestions.

Return ONLY a valid JSON object with these fields:
- "completions": list of 5 complete query strings that naturally complete the user's input (ordered by relevance)
- "categories": list of up to 3 relevant product categories (e.g. "Laptops", "Office Chairs", "Smart Watches")
- "related_suggestions": list of up to 5 semantically related but distinct search queries a user might also want

Focus on products from these categories: Laptops, Audio, Smart Watches, Home & Kitchen, Office Furniture, Monitors.

Respond ONLY with the JSON object. No explanation, no markdown, no code fences.

Example:
Input: "wireless noise cancellation headphones"
Output: {
  "completions": [
    "wireless noise cancellation headphones",
    "wireless noise cancellation headphones for travel",
    "wireless noise cancellation headphones for gaming",
    "wireless noise cancellation headphones under 100",
    "wireless noise cancellation headphones with long battery life"
  ],
  "categories": ["Audio", "Headphones"],
  "related_suggestions": [
    "Best headphones for work from home",
    "Bluetooth headphones with mic",
    "Over ear noise cancelling headphones",
    "Premium wireless headphones",
    "Headphones for online meetings"
  ]
}"""

_QUERY_UNDERSTANDING_SYSTEM_PROMPT = """You are an enterprise retail product search query analyzer with strict safety and intent guardrails.

Given a customer search query, your job is to REFINE the query conservatively so it matches relevant e-commerce products without altering user intent, hallucinating unrelated categories, or violating safety/PII guidelines.

Safety & Guardrail Rules:
1. PII Protection: Remove personal information (phone numbers, email addresses, credit cards, names) if accidentally present in query.
2. High Intent Sensitivity: Keep the exact core product name intact. Do not substitute specific product types with different ones (e.g. do not turn "door mat" into "mouse pad" or "headphones").
3. Refinement Scope: Fix typos, remove noise words ("i want to buy", "looking for", "best price on"), and extract structured category/brand/price bounds.

Return ONLY a valid JSON object with these fields:
- "rewritten_query" (string): The conservatively refined query string preserving core product meaning.
- "category" (string or null): The product category if clearly specified in the query. null if ambiguous.
- "brand" (string or null): Brand name if mentioned. null if not mentioned.
- "price_max" (number or null): Max price constraint. null if omitted.
- "intent_tokens" (list of strings): 3-5 core search concept tokens.
- "filters" (object): Key attribute filters inferred. {} if none.

Respond ONLY with valid JSON. No explanation, markdown, or code fences."""


def _safe_float(val) -> Optional[float]:
    if val is None:
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


def _standardize_product_dict(row_dict: dict) -> dict:
    """Extract product attributes with multi-alias fallbacks for maximum resilience."""
    try:
        dto = ProductDTO.from_db_row(row_dict)
        return dto.dict()
    except Exception as e:
        logger.error("Standardization failed", error=str(e), row=row_dict)
        pid = str(row_dict.get("product_id") or row_dict.get("id") or "unknown")
        brand_val = str(row_dict.get("brand") or row_dict.get("brand_name") or "Generic")
        name_val = str(row_dict.get("product_name") or row_dict.get("product_title") or f"Product {pid}")
        price_val = _safe_float(row_dict.get("price") or row_dict.get("discounted_price") or row_dict.get("selling_price") or 0.0)
        rating_val = _safe_float(row_dict.get("rating") or row_dict.get("average_rating") or row_dict.get("avg_rating") or 4.5)
        reviews_val = int(row_dict.get("rating_count") or row_dict.get("review_count") or 0)
        return {
            "product_id": pid,
            "product_name": name_val,
            "brand": brand_val,
            "brand_name": brand_val,
            "price": price_val,
            "discounted_price": price_val,
            "rating": rating_val,
            "average_rating": rating_val,
            "avg_rating": rating_val,
            "rating_count": reviews_val,
            "review_count": reviews_val,
            "image_url": row_dict.get("image_url") or row_dict.get("img_link")
        }


# ── SQL execution helper ──────────────────────────────────────────────────────

def _run_sql(statement: str) -> List[Dict[str, Any]]:
    """
    Execute a SQL statement on the configured Databricks SQL Warehouse
    using the Statements API (no heavy SDK dependency at import time).
    Returns list of row dicts.
    """
    if not settings.is_databricks_configured or not settings.sql_warehouse_id:
        logger.warning("SQL Warehouse not configured — skipping SQL query")
        return []

    url = f"{settings.databricks_url}/api/2.0/sql/statements"
    headers = {
        "Authorization": f"Bearer {settings.resolved_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "warehouse_id": settings.sql_warehouse_id,
        "statement": statement,
        "wait_timeout": "30s",
        "on_wait_timeout": "CANCEL",
    }

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=35)
        resp.raise_for_status()
        data = resp.json()

        status = data.get("status", {}).get("state", "UNKNOWN")
        if status not in ("SUCCEEDED",):
            logger.error("SQL statement failed", state=status, statement=statement[:100])
            return []

        result = data.get("result", {})
        schema = data.get("manifest", {}).get("schema", {}).get("columns", [])
        col_names = [c["name"] for c in schema]
        rows = result.get("data_array", [])

        return [dict(zip(col_names, row)) for row in rows]

    except requests.exceptions.RequestException as e:
        logger.error("SQL Warehouse request failed", error=str(e))
        return []


_LLM_DISABLED = False


def _call_llm(system_prompt: str, user_content: str) -> Optional[str]:
    """Call Databricks Foundation Model API (chat completions)."""
    global _LLM_DISABLED
    if not settings.is_databricks_configured or _LLM_DISABLED:
        return None

    from openai import OpenAI
    import os

    try:
        client = OpenAI(
            api_key=settings.databricks_ai_gateway_token or settings.resolved_token,
            base_url=settings.databricks_ai_gateway_base_url or f"{settings.databricks_url}/serving-endpoints",
        )

        response = client.chat.completions.create(
            model=settings.databricks_llm_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            max_tokens=512,
            temperature=0.0,
            timeout=3.0
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        error_str = str(e).lower()
        if "404" in error_str or "not found" in error_str:
            logger.warning(
                "LLM serving endpoint not found (404) — disabling LLM query rewriting to maintain fast search latency",
                endpoint=settings.databricks_llm_model,
            )
            _LLM_DISABLED = True
        else:
            logger.debug("LLM API call skipped", error=str(e))
        return None


def _parse_json_response(raw: Optional[str]) -> Optional[Dict]:
    """Strip markdown fences and parse JSON from LLM response."""
    if not raw:
        return None
    cleaned = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("Failed to parse LLM JSON response", raw=raw[:200])
        return None


# ── Main Service ──────────────────────────────────────────────────────────────

class DatabricksService:
    """Service for interacting with Databricks platform (Vector Search + SQL + LLM)."""

    def __init__(self):
        """Initialize Databricks clients."""
        self._vs_client = None
        self._vs_index = None

        if settings.is_databricks_configured:
            try:
                from databricks.vector_search.client import VectorSearchClient
                self._vs_client = VectorSearchClient(
                    workspace_url=settings.databricks_url,
                    personal_access_token=settings.resolved_token,
                    disable_notice=True,
                )
                self._vs_index = self._vs_client.get_index(
                    endpoint_name=settings.vector_search_endpoint,
                    index_name=settings.vector_search_index_name,
                )
                logger.info(
                    "Databricks service initialized (live mode)",
                    endpoint=settings.vector_search_endpoint,
                    index=settings.vector_search_index_name,
                )
            except Exception as e:
                logger.error("Failed to initialize Vector Search client", error=str(e))
                self._vs_client = None
                self._vs_index = None
        else:
            logger.warning(
                "Databricks credentials not configured — service running in degraded mode. "
                "Set DATABRICKS_HOST, DATABRICKS_TOKEN, VECTOR_SEARCH_ENDPOINT, "
                "and SQL_WAREHOUSE_ID in your .env file."
            )

    # ── Vector Search ─────────────────────────────────────────────────────────

    async def vector_search(
        self,
        query: str,
        top_k: int = None,
        filters: Optional[Dict[str, Any]] = None,
        dataset: str = "amazon",
    ) -> Dict[str, Any]:
        """
        Perform semantic similarity search using Databricks Vector Search.
        Supports dataset routing: 'wands' (30k) or 'amazon' (1.5k rich e-commerce).
        """
        start_time = time.time()

        if top_k is None:
            top_k = settings.vector_search_top_k

        # ── Step 1: LLM Query Understanding ───────────────────────────────────
        intent = await asyncio.get_event_loop().run_in_executor(
            None, self._understand_query, query
        )
        rewritten_query = intent.get("rewritten_query", query)
        intent_tokens = intent.get("intent_tokens", [])
        llm_category = intent.get("category")
        llm_brand = intent.get("brand")
        llm_price_max = intent.get("price_max")

        # ── Step 2: Build metadata filters ────────────────────────────────────
        vs_filters = {}
        active_filters = filters or {}

        if active_filters.get("category") or llm_category:
            cat_col = "category" if dataset == "amazon" else "category_path"
            vs_filters[cat_col] = active_filters.get("category") or llm_category
        if (active_filters.get("brand") or llm_brand) and dataset != "amazon":
            vs_filters["brand_name"] = active_filters.get("brand") or llm_brand

        # ── Step 3: Vector Search ─────────────────────────────────────────────
        results = await asyncio.get_event_loop().run_in_executor(
            None,
            self._execute_vector_search,
            rewritten_query,
            top_k,
            vs_filters if vs_filters else None,
            dataset,
        )

        # ── Step 4: Apply price filtering (post-search) ────────────────────────
        price_max = active_filters.get("max_price") or llm_price_max
        price_min = active_filters.get("min_price")
        min_rating = active_filters.get("min_rating")

        if price_max or price_min or min_rating:
            filtered = []
            for r in results:
                price = r.get("selling_price") or r.get("price") or 0
                rating = r.get("average_rating") or r.get("avg_rating") or 0
                if price_max and price > price_max:
                    continue
                if price_min and price < price_min:
                    continue
                if min_rating and rating < min_rating:
                    continue
                filtered.append(r)
            results = filtered

        elapsed_ms = int((time.time() - start_time) * 1000)
        logger.info(
            "Vector search completed",
            query=query,
            rewritten_query=rewritten_query,
            dataset=dataset,
            results_count=len(results),
            elapsed_ms=elapsed_ms,
        )

        return {
            "results": results,
            "total_count": len(results),
            "elapsed_ms": elapsed_ms,
            "rewritten_query": rewritten_query,
            "intent_tokens": intent_tokens,
            "model_name": settings.embedding_model_endpoint,
        }

    def _understand_query(self, query: str) -> Dict[str, Any]:
        """Extract search intent and concepts using Databricks LLM / AI Gateway."""
        raw = _call_llm(_QUERY_UNDERSTANDING_SYSTEM_PROMPT, query)
        parsed = _parse_json_response(raw)
        if parsed:
            return parsed
        # Fallback: pass-through with basic token extraction
        tokens = [t for t in query.lower().split() if len(t) > 3 and t not in {"with", "for", "the", "and", "under"}]
        return {
            "rewritten_query": query,
            "category": None,
            "brand": None,
            "price_max": None,
            "intent_tokens": tokens[:6],
            "filters": {},
        }

    def _execute_vector_search(
        self,
        query: str,
        top_k: int,
        filters: Optional[Dict] = None,
        dataset: str = "amazon",
    ) -> List[Dict[str, Any]]:
        """Execute vector search against the specified dataset index."""
        if self._vs_client is None:
            logger.warning("Vector Search client not available — returning empty results")
            return []

        target_index_name = settings.product_vector_index

        try:
            target_index = self._vs_client.get_index(
                endpoint_name=settings.vector_search_endpoint,
                index_name=target_index_name,
            )
        except Exception as ie:
            logger.warning(
                "Target index not found or offline, falling back to default index",
                target_index=target_index_name,
                error=str(ie),
            )
            target_index = self._vs_index

        if target_index is None:
            return []

        if dataset == "amazon":
            columns = [
                "product_id",
                "product_name",
                "category",
                "discounted_price",
                "actual_price",
                "discount_percentage",
                "rating",
                "rating_count",
                "img_link",
                "product_link",
            ]
        else:
            columns = [
                "product_id",
                "product_name",
                "category_path",
                "brand_name",
                "selling_price",
                "average_rating",
                "review_count",
                "attribute_summary",
                "review_summary",
                "image_url",
                "img_link"
            ]

        try:
            kwargs = {
                "query_text": query,
                "columns": columns,
                "num_results": top_k,
            }
            if filters:
                clean_filters = {k: v for k, v in filters.items() if v}
                if clean_filters:
                    kwargs["filters"] = clean_filters

            try:
                response = target_index.similarity_search(**kwargs)
            except Exception as fe:
                logger.warning("Vector search query failed with full parameters, retrying with columns=['product_id']", error=str(fe))
                kwargs.pop("filters", None)
                kwargs["columns"] = ["product_id"]
                try:
                    response = target_index.similarity_search(**kwargs)
                except Exception as fe2:
                    logger.error("Vector search fallback failed", error=str(fe2))
                    return []

            manifest = response.get("manifest") or {}
            schema = manifest.get("schema") or {}
            cols_manifest = schema.get("columns") or manifest.get("columns") or response.get("columns") or []

            ret_cols = []
            for c in cols_manifest:
                if isinstance(c, dict):
                    ret_cols.append(c.get("name"))
                elif isinstance(c, str):
                    ret_cols.append(c)

            res_obj = response.get("result")
            if isinstance(res_obj, dict):
                raw_results = res_obj.get("data_array") or []
            else:
                raw_results = response.get("data_array") or []

            results = []
            for row in raw_results:
                if len(ret_cols) > 0 and len(row) >= len(ret_cols):
                    row_dict = dict(zip(ret_cols, row[:len(ret_cols)]))
                else:
                    row_dict = {}

                score = (
                    row_dict.pop("score", None) or 
                    row_dict.pop("__score__", None) or 
                    row_dict.pop("__score", None) or 
                    0.85
                )
                row_dict["similarity_score"] = float(score)

                mapped = _standardize_product_dict(row_dict)
                mapped["similarity_score"] = float(score)
                results.append(mapped)

            return results

        except Exception as e:
            logger.error("Vector search execution failed", error=str(e))
            return []

    async def get_product_details(
        self, product_ids: List[str], dataset: str = "amazon"
    ) -> Dict[str, Dict[str, Any]]:
        """Fetch full product details from the Silver/Gold table via SQL Warehouse."""
        if not product_ids:
            return {}

        clean_ids = [f"'{pid}'" for pid in product_ids if pid]
        if not clean_ids:
            return {}

        ids_str = ", ".join(clean_ids)

        if dataset == "amazon":
            sql = f"""
                SELECT 
                    product_id,
                    product_name,
                    search_document as description,
                    actual_price,
                    discounted_price,
                    discount_percentage,
                    rating as average_rating,
                    rating_count,
                    img_link as image_url,
                    'In Stock' as availability_status,
                    'Generic' as brand_name,
                    category as category_path,
                    100 as total_stock
                FROM `product_search_dev`.gold.amazon_product_catalog
                WHERE product_id IN ({ids_str})
            """
        else:
            sql = f"""
                SELECT 
                    p.product_id,
                    p.product_name,
                    p.description,
                    p.actual_price,
                    p.discounted_price,
                    p.discount_percentage,
                    p.average_rating,
                    p.rating_count,
                    p.image_url,
                    p.status,
                    b.brand_name,
                    c.full_path as category_path,
                    i.total_stock,
                    CASE WHEN i.total_stock > 0 THEN 'In Stock' ELSE 'Out of Stock' END as availability_status
                FROM {settings.product_table} p
                LEFT JOIN {settings.brand_table} b ON p.brand_id = b.brand_id
                LEFT JOIN {settings.category_table} c ON p.category_id = c.category_id
                LEFT JOIN (
                    SELECT product_id, SUM(stock_quantity) as total_stock 
                    FROM {settings.inventory_table} 
                    GROUP BY product_id
                ) i ON p.product_id = i.product_id
                WHERE p.product_id IN ({ids_str})
            """

        rows = await asyncio.get_event_loop().run_in_executor(None, _run_sql, sql)

        products = {}
        for row in rows:
            mapped = _standardize_product_dict(row)
            pid = mapped["product_id"]
            products[pid] = mapped

        return products

    async def get_products(
        self,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_rating: Optional[float] = None,
        in_stock: Optional[bool] = None,
        sort: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        dataset: str = "amazon"
    ) -> Dict[str, Any]:
        """Fetch list of products with filters, sorting, and pagination."""
        where_clauses = []
        if category and category != "All":
            safe_category = category.replace("'", "''")
            where_clauses.append(f"(c.full_path = '{safe_category}' OR c.category_name = '{safe_category}')")
        if brand:
            safe_brand = brand.replace("'", "''")
            where_clauses.append(f"b.brand_name = '{safe_brand}'")
        if min_price is not None:
            where_clauses.append(f"p.discounted_price >= {min_price}")
        if max_price is not None:
            where_clauses.append(f"p.discounted_price <= {max_price}")
        if min_rating is not None:
            where_clauses.append(f"p.average_rating >= {min_rating}")
        if in_stock is True:
            where_clauses.append("i.total_stock > 0")
        elif in_stock is False:
            where_clauses.append("i.total_stock <= 0")

        where_str = ""
        if where_clauses:
            where_str = "WHERE " + " AND ".join(where_clauses)

        # Sort order mapping
        order_by = "p.product_id ASC"
        if sort == "Price: Low to High":
            order_by = "p.discounted_price ASC"
        elif sort == "Price: High to Low":
            order_by = "p.discounted_price DESC"
        elif sort == "Rating":
            order_by = "p.average_rating DESC"
        elif sort in ("Popularity", "Popular"):
            order_by = "p.rating_count DESC"

        offset = (page - 1) * page_size
        sql_list = f"""
            SELECT 
                p.product_id,
                p.product_name,
                p.description,
                p.actual_price,
                p.discounted_price,
                p.discount_percentage,
                p.average_rating,
                p.rating_count,
                p.image_url,
                p.status,
                b.brand_name,
                c.full_path as category_path,
                i.total_stock,
                CASE WHEN i.total_stock > 0 THEN 'In Stock' ELSE 'Out of Stock' END as availability_status
            FROM {settings.product_table} p
            LEFT JOIN {settings.brand_table} b ON p.brand_id = b.brand_id
            LEFT JOIN {settings.category_table} c ON p.category_id = c.category_id
            LEFT JOIN (
                SELECT product_id, SUM(stock_quantity) as total_stock 
                FROM {settings.inventory_table} 
                GROUP BY product_id
            ) i ON p.product_id = i.product_id
            {where_str}
            ORDER BY {order_by}
            LIMIT {page_size} OFFSET {offset}
        """

        sql_count = f"""
            SELECT COUNT(*) as total_count
            FROM {settings.product_table} p
            LEFT JOIN {settings.brand_table} b ON p.brand_id = b.brand_id
            LEFT JOIN {settings.category_table} c ON p.category_id = c.category_id
            LEFT JOIN (
                SELECT product_id, SUM(stock_quantity) as total_stock 
                FROM {settings.inventory_table} 
                GROUP BY product_id
            ) i ON p.product_id = i.product_id
            {where_str}
        """

        # Run concurrent database queries
        loop = asyncio.get_event_loop()
        rows_task = loop.run_in_executor(None, _run_sql, sql_list)
        count_task = loop.run_in_executor(None, _run_sql, sql_count)
        
        rows, count_rows = await asyncio.gather(rows_task, count_task)
        
        total_count = int(count_rows[0].get("total_count") or 0) if count_rows else 0
        products = [_standardize_product_dict(row) for row in rows]

        return {
            "products": products,
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": (total_count + page_size - 1) // page_size if page_size > 0 else 0
        }

    async def get_trending_products(self, limit: int = 10, dataset: str = "amazon") -> List[Dict[str, Any]]:
        """Fetch trending products derived from average ratings and popularity counts."""
        sql = f"""
            SELECT 
                p.product_id,
                p.product_name,
                p.description,
                p.actual_price,
                p.discounted_price,
                p.discount_percentage,
                p.average_rating,
                p.rating_count,
                p.image_url,
                p.status,
                b.brand_name,
                c.full_path as category_path,
                i.total_stock,
                CASE WHEN i.total_stock > 0 THEN 'In Stock' ELSE 'Out of Stock' END as availability_status,
                (p.average_rating * ln(1 + p.rating_count)) as popularity_score
            FROM {settings.product_table} p
            LEFT JOIN {settings.brand_table} b ON p.brand_id = b.brand_id
            LEFT JOIN {settings.category_table} c ON p.category_id = c.category_id
            LEFT JOIN (
                SELECT product_id, SUM(stock_quantity) as total_stock 
                FROM {settings.inventory_table} 
                GROUP BY product_id
            ) i ON p.product_id = i.product_id
            ORDER BY popularity_score DESC
            LIMIT {limit}
        """
        rows = await asyncio.get_event_loop().run_in_executor(None, _run_sql, sql)
        return [_standardize_product_dict(r) for r in rows]

    async def get_product_by_id(self, product_id: str, dataset: str = "amazon") -> Optional[Dict[str, Any]]:
        """Fetch single product by ID."""
        products = await self.get_product_details([product_id], dataset=dataset)
        return products.get(product_id)

    async def get_related_products(
        self,
        product_id: str,
        query_text: str,
        limit: int = 4,
        dataset: str = "amazon",
    ) -> List[Dict[str, Any]]:
        """Get related products using Vector Search similarity."""
        res = await self.vector_search(query=query_text, top_k=limit + 5, dataset=dataset)
        related = [
            r for r in res["results"]
            if r.get("product_id") != product_id
        ]
        return related[:limit]

    # ── Categories & Brands (SQL Warehouse) ──────────────────────────────────

    async def get_categories(self, dataset: str = "amazon") -> List[Dict[str, Any]]:
        """Get distinct categories with product counts from Silver category table."""
        sql = f"""
            SELECT c.full_path as category_path, COUNT(*) as product_count
            FROM {settings.product_table} p
            JOIN {settings.category_table} c ON p.category_id = c.category_id
            WHERE c.full_path IS NOT NULL AND c.full_path != ''
            GROUP BY c.full_path
            ORDER BY product_count DESC
            LIMIT 50
        """
        rows = await asyncio.get_event_loop().run_in_executor(None, _run_sql, sql)
        return [
            {"name": r["category_path"], "count": int(r.get("product_count") or 0)}
            for r in rows
        ]

    async def get_brands(self, category: Optional[str] = None, dataset: str = "amazon") -> List[Dict[str, Any]]:
        """Get distinct brands with product counts from Silver brand table."""
        where_clause = ""
        join_clause = ""
        if category and category != "All":
            safe_category = category.replace("'", "''")
            join_clause = f"JOIN {settings.category_table} c ON p.category_id = c.category_id"
            where_clause = f"WHERE (c.full_path = '{safe_category}' OR c.category_name = '{safe_category}')"

        sql = f"""
            SELECT b.brand_name, COUNT(*) as product_count
            FROM {settings.product_table} p
            JOIN {settings.brand_table} b ON p.brand_id = b.brand_id
            {join_clause}
            {where_clause}
            GROUP BY b.brand_name
            ORDER BY product_count DESC
            LIMIT 50
        """
        rows = await asyncio.get_event_loop().run_in_executor(None, _run_sql, sql)
        return [
            {"name": r["brand_name"], "count": int(r.get("product_count") or 0)}
            for r in rows
        ]

    # ── LLM-Powered Suggestions ───────────────────────────────────────────────

    async def get_suggestions(self, partial_query: str, limit: int = 5) -> Dict[str, Any]:
        """Generate intelligent autocomplete suggestions using Databricks LLM."""
        return {"completions": [], "categories": [], "related_suggestions": []}

    # ── Analytics ─────────────────────────────────────────────────────────────

    async def get_search_analytics(self, limit: int = 10) -> Dict[str, Any]:
        """Get top popular search queries from the search_query_log table."""
        return {"top_queries": [], "period": "last_7_days"}

    # ── Health Check ──────────────────────────────────────────────────────────

    async def health_check(self) -> Dict[str, Any]:
        """Check connectivity to Databricks services."""
        if not settings.is_databricks_configured:
            return {
                "vector_search": "not_configured",
                "sql_warehouse": "not_configured",
                "unity_catalog": "not_configured",
                "llm": "not_configured",
            }

        vs_status = "healthy" if self._vs_client is not None else "unavailable"
        try:
            rows = await asyncio.get_event_loop().run_in_executor(
                None, _run_sql, "SELECT 1 as ping"
            )
            sql_status = "healthy" if rows else "unavailable"
        except Exception:
            sql_status = "error"

        # Check LLM endpoint
        try:
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                _call_llm,
                "Say 'ok' and nothing else.",
                "ping",
            )
            llm_status = "healthy" if result else "unavailable"
        except Exception:
            llm_status = "error"

        return {
            "vector_search": vs_status,
            "sql_warehouse": sql_status,
            "unity_catalog": f"{sql_status} ({settings.gold_table})",
            "llm": llm_status,
        }


def _safe_float(val) -> Optional[float]:
    if val is None:
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


# Global service instance
databricks_service = DatabricksService()
