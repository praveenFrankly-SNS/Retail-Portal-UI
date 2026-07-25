"""
Products API endpoints
"""
from fastapi import APIRouter, HTTPException, Query, status, Request
from typing import Optional
import json
import hashlib
from app.services.search_service import search_service
from app.services.databricks_service import databricks_service
from app.services.session_service import session_service
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/products", tags=["products"])

def _get_cache(key: str) -> Optional[dict]:
    if not session_service.enabled: return None
    try:
        val = session_service.redis.get(key)
        if val: return json.loads(val)
    except Exception as e:
        logger.warning(f"Redis get failed for {key}", error=str(e))
    return None

def _set_cache(key: str, data: dict, ttl: int = 3600):
    if not session_service.enabled: return
    try:
        session_service.redis.setex(key, ttl, json.dumps(data))
    except Exception as e:
        logger.warning(f"Redis set failed for {key}", error=str(e))


@router.get("/categories")
async def get_categories(
    dataset: str = Query(default="amazon", description="Dataset variant: 'wands' or 'amazon'")
):
    """
    Get all product categories with counts from the Gold table.
    """
    cache_key = f"catalog:categories:{dataset}"
    cached = _get_cache(cache_key)
    if cached: return cached

    try:
        categories = await databricks_service.get_categories(dataset=dataset)
        res = {"categories": categories}
        _set_cache(cache_key, res, 86400) # cache for 1 day
        return res
    except Exception as e:
        logger.error("Failed to fetch categories", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch categories",
        )


@router.get("/brands")
async def get_brands(
    category: Optional[str] = Query(default=None, description="Filter brands by category"),
    dataset: str = Query(default="amazon", description="Dataset variant: 'wands' or 'amazon'"),
):
    """
    Get distinct brands with product counts, optionally filtered by category.
    """
    cache_key = f"catalog:brands:{category}:{dataset}"
    cached = _get_cache(cache_key)
    if cached: return cached

    try:
        brands = await databricks_service.get_brands(category=category, dataset=dataset)
        res = {"brands": brands}
        _set_cache(cache_key, res, 86400)
        return res
    except Exception as e:
        logger.error("Failed to fetch brands", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch brands",
        )


@router.get("")
async def get_products(
    category: Optional[str] = Query(default=None),
    brand: Optional[str] = Query(default=None),
    min_price: Optional[float] = Query(default=None),
    max_price: Optional[float] = Query(default=None),
    min_rating: Optional[float] = Query(default=None),
    sort: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1),
    dataset: str = Query(default="amazon"),
    request: Request = None,
):
    """Get list of products matching catalog filters with pagination."""
    # Create deterministic cache key for catalog filters
    qparams = dict(request.query_params) if request else {}
    hash_key = hashlib.md5(json.dumps(qparams, sort_keys=True).encode()).hexdigest()
    cache_key = f"catalog:products:{hash_key}"
    
    cached = _get_cache(cache_key)
    if cached: return cached

    try:
        res = await databricks_service.get_products(
            category=category,
            brand=brand,
            min_price=min_price,
            max_price=max_price,
            min_rating=min_rating,
            sort=sort,
            page=page,
            page_size=page_size,
            dataset=dataset,
        )
        _set_cache(cache_key, res, 3600) # cache for 1 hour
        return res
    except Exception as e:
        logger.error("Failed to fetch products list", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to browse product catalog",
        )


@router.get("/trending")
async def get_trending(
    limit: int = Query(default=10, ge=1),
    dataset: str = Query(default="amazon")
):
    """Get trending products ranked by average rating and count."""
    cache_key = f"catalog:trending:{limit}:{dataset}"
    cached = _get_cache(cache_key)
    if cached: return cached

    try:
        products = await databricks_service.get_trending_products(limit=limit, dataset=dataset)
        res = {"products": products}
        _set_cache(cache_key, res, 3600)
        return res
    except Exception as e:
        logger.error("Failed to fetch trending products", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve trending products",
        )


@router.get("/{product_id}")
async def get_product(
    product_id: str,
    dataset: str = Query(default="amazon", description="Dataset variant: 'wands' or 'amazon'"),
):
    """
    Get full product details by ID from the specified dataset Gold table.
    """
    cache_key = f"catalog:product_detail:{product_id}:{dataset}"
    cached = _get_cache(cache_key)
    if cached: return cached

    try:
        product = await databricks_service.get_product_by_id(product_id, dataset=dataset)

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product '{product_id}' not found",
            )

        query_text = product.get("description") or product.get("attribute_summary") or product.get("product_name") or ""
        related = await databricks_service.get_related_products(
            product_id=product_id,
            query_text=query_text,
            limit=4,
            dataset=dataset,
        )

        res = {
            **product,
            "related_products": related,
        }
        _set_cache(cache_key, res, 86400)
        return res

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to fetch product", product_id=product_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch product details",
        )


@router.get("/{product_id}/image")
async def get_product_image(product_id: str):
    """
    Product image placeholder — redirects to picsum seeded by product_id hash.
    Replace with actual image storage (S3, Azure Blob, DBFS) in production.
    """
    from fastapi.responses import RedirectResponse
    seed = abs(hash(product_id)) % 1000
    return RedirectResponse(
        url=f"https://picsum.photos/seed/{seed}/400/400",
        status_code=302,
    )
