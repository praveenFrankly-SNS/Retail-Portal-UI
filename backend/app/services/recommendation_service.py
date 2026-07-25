"""
Recommendation Gateway Service
FastAPI Backend — Retail AI Portal
"""

import os
import sys
import time
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Any
from app.core.config import settings
from app.core.logging import get_logger
from app.services.session_service import session_service

logger = get_logger(__name__)

MOCK_PRODUCTS_DATA = [
  {
    "product_id": "MOCK-001",
    "product_name": "Logitech MX Keys Wireless Keyboard",
    "brand": "Logitech",
    "price": 7699,
    "rating": 4.6,
    "rating_count": 1200,
    "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop",
    "relationship": "COMPLEMENTARY",
    "concept": "Wireless productivity",
    "final_score": 0.91,
    "reason": "Perfect for your office setup — pairs great with your recently viewed laptop"
  },
  {
    "product_id": "MOCK-002",
    "product_name": "Sony WH-1000XM5 Wireless Headphones",
    "brand": "Sony",
    "price": 24990,
    "rating": 4.7,
    "rating_count": 2345,
    "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    "relationship": "SIMILAR",
    "concept": "Premium audio",
    "final_score": 0.88,
    "reason": "You viewed similar headphones — this is the top-rated upgrade"
  },
  {
    "product_id": "MOCK-003",
    "product_name": "Ugreen USB-C Hub 6-in-1 Adapter",
    "brand": "Ugreen",
    "price": 3999,
    "rating": 4.5,
    "rating_count": 980,
    "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
    "relationship": "ACCESSORY",
    "concept": "Laptop connectivity expansion",
    "final_score": 0.85,
    "reason": "Complements your laptop — searched 'USB-C hub' recently"
  },
  {
    "product_id": "MOCK-005",
    "product_name": "BenQ 27\" 4K Monitor IPS",
    "brand": "BenQ",
    "price": 32999,
    "rating": 4.6,
    "rating_count": 1100,
    "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop",
    "relationship": "COMPLEMENTARY",
    "concept": "Laptop dual-monitor setup",
    "final_score": 0.83,
    "reason": "Popular with similar shoppers who bought the same laptop"
  },
  {
    "product_id": "MOCK-006",
    "product_name": "Adjustable Aluminium Laptop Stand",
    "brand": "Twelve South",
    "price": 2999,
    "rating": 4.4,
    "rating_count": 750,
    "image_url": "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=400&fit=crop",
    "relationship": "ACCESSORY",
    "concept": "Ergonomic laptop positioning",
    "final_score": 0.81,
    "reason": "In cart frequently with the laptop you are viewing"
  }
]


class RecommendationService:

    def get_recommendations(
        self,
        customer_id: str,
        surface: str,
        current_product_id: Optional[str] = None,
        limit: int = 8,
        session_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        start_time = time.time()

        # Explicit mode check — no silent fallback in live mode
        if settings.is_mock_mode:
            logger.info("APP_DATA_MODE=mock — returning static recommendations")
            return self._generate_fallback(customer_id, surface, limit)

        # Live mode: Databricks must be configured
        if not settings.is_databricks_configured:
            return {
                "status": "error",
                "code": "DATABRICKS_UNAVAILABLE",
                "message": "Recommendation service is unavailable because Databricks credentials are not configured. Set APP_DATA_MODE=mock for offline demo.",
            }

        bundle_path = self._resolve_bundle_path()
        if bundle_path is None:
            return {
                "status": "error",
                "code": "BUNDLE_NOT_FOUND",
                "message": "Recommendation Bundle not found. Set RECOMMENDATION_BUNDLE_PATH or APP_DATA_MODE=mock.",
            }

        if str(bundle_path) not in sys.path:
            sys.path.insert(0, str(bundle_path))

        try:
            from src.config.loader import AcceleratorConfig
            from src.recommendation.repositories.sql_customer_context_repository import SqlCustomerContextRepository
            from src.recommendation.recommendation_service import generate_recommendations

            clean_host = settings.databricks_host.rstrip("/")
            if not clean_host.startswith("http"):
                clean_host = f"https://{clean_host}"
            os.environ["DATABRICKS_HOST"] = clean_host
            os.environ["DATABRICKS_TOKEN"] = settings.resolved_token

            config = AcceleratorConfig()
            warehouse_id = settings.sql_warehouse_id or config.serving.get("warehouse_id", "")
            catalog = config.catalog
            gold_schema = config.gold_schema

            repository = SqlCustomerContextRepository(
                databricks_host=f"https://{clean_host}",
                token=settings.resolved_token,
                warehouse_id=warehouse_id,
                catalog=catalog,
                gold_schema=gold_schema
            )

            # Retrieve ultra-fast live session context from Redis
            redis_context = session_service.get_customer_context(customer_id)
            merged_context = {
                "recent_searches": redis_context.get("recent_searches", []),
                "recent_views": redis_context.get("recent_views", []),
                "cart": redis_context.get("cart", []),
                **(session_context or {})
            }

            logger.info("Executing Phase 7 recommendation pipeline", customer_id=customer_id, surface=surface)
            engine_response = generate_recommendations(
                spark=repository,
                customer_id=customer_id,
                surface=surface,
                config=config,
                current_product_id=current_product_id,
                limit=limit,
                session_context=merged_context
            )

            raw_recs = engine_response.get("recommendations", [])
            rec_pids = [r.get("product_id") for r in raw_recs if r.get("product_id")]

            # Look up real product details from Databricks SQL Warehouse
            db_details = {}
            if rec_pids:
                try:
                    from app.services.databricks_service import databricks_service
                    import asyncio
                    try:
                        loop = asyncio.get_event_loop()
                        if loop.is_running():
                            import concurrent.futures
                            with concurrent.futures.ThreadPoolExecutor() as executor:
                                db_details = executor.submit(
                                    lambda: asyncio.run(databricks_service.get_product_details(rec_pids))
                                ).result()
                        else:
                            db_details = loop.run_until_complete(databricks_service.get_product_details(rec_pids))
                    except Exception as loop_e:
                        db_details = asyncio.run(databricks_service.get_product_details(rec_pids))
                except Exception as db_e:
                    logger.warning("Could not fetch DB product details for recommendations", error=str(db_e))

            enriched_recs = []
            for rec in raw_recs:
                pid = rec.get("product_id")
                db_p = db_details.get(pid, {}) if pid else {}

                price_tier = rec.get("price_tier", "MEDIUM").upper()
                real_price = db_p.get("discounted_price") or db_p.get("price") or rec.get("price")
                if real_price:
                    price = float(real_price)
                else:
                    if "LOW" in price_tier:
                        price = 1499
                    elif "HIGH" in price_tier:
                        price = 24990
                    else:
                        price = 7699

                raw_image = db_p.get("image_url") or db_p.get("img_link") or rec.get("image_url") or rec.get("img_link") or ""
                if raw_image and raw_image.startswith("http"):
                    img = raw_image
                else:
                    prod_name = (db_p.get("product_name") or rec.get("product_name") or "").lower()
                    if "keyboard" in prod_name:
                        img = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop"
                    elif "headphone" in prod_name or "earphone" in prod_name or "audio" in prod_name:
                        img = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"
                    elif "monitor" in prod_name or "display" in prod_name or "screen" in prod_name:
                        img = "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop"
                    elif "stand" in prod_name:
                        img = "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=400&fit=crop"
                    elif "hub" in prod_name or "adapter" in prod_name or "dock" in prod_name:
                        img = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop"
                    else:
                        img = "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop"

                enriched_recs.append({
                    "product_id": pid,
                    "product_name": db_p.get("product_name") or rec.get("product_name"),
                    "brand": db_p.get("brand_name") or db_p.get("brand") or rec.get("brand_name") or rec.get("brand") or "Generic",
                    "price": price,
                    "rating": float(db_p.get("rating") or db_p.get("average_rating") or rec.get("rating", 4.5)),
                    "rating_count": int(db_p.get("rating_count") or db_p.get("review_count") or rec.get("rating_count", 850)),
                    "image_url": img,
                    "relationship": rec.get("relationship"),
                    "concept": rec.get("concept"),
                    "final_score": float(rec.get("final_score", 0.0)),
                    "reason": rec.get("reason")
                })

            latency_ms = int((time.time() - start_time) * 1000)
            logger.info("Recommendations completed", count=len(enriched_recs), latency_ms=latency_ms)

            return {
                "request_id": engine_response.get("request_id"),
                "customer_id": customer_id,
                "surface": surface,
                "context_summary": engine_response.get("context_summary"),
                "intent": engine_response.get("intent"),
                "concepts": engine_response.get("concepts", []),
                "recommendations": enriched_recs,
                "latency_ms": latency_ms
            }

        except Exception as e:
            logger.error("Phase 7 pipeline failed", error=str(e))
            return {
                "status": "error",
                "code": "RECOMMENDATION_FAILED",
                "message": f"Recommendation engine error: {str(e)}",
            }

    def _resolve_bundle_path(self) -> Optional[Path]:
        env_path = settings.recommendation_bundle_path.strip()
        if env_path:
            p = Path(env_path).resolve()
            if p.exists():
                return p
            logger.warning("RECOMMENDATION_BUNDLE_PATH set but not found", path=str(p))

        candidates = []
        f = Path(__file__).resolve()
        for parent_count in range(1, 9):
            ancestor = f.parents[parent_count - 1] if parent_count <= len(f.parents) else None
            if ancestor is None:
                break
            candidates.append(ancestor / "ProductRecommendation-Bundle")
            candidates.append(ancestor / "product-recommendation")
            candidates.append(ancestor / "Product-recommendation")
            if parent_count >= 2:
                candidates.append(ancestor / "retail" / "product-recommendation")
                candidates.append(ancestor / "retail" / "Product-recommendation")
                candidates.append(ancestor / "Product-recommendation" / "ProductRecommendation-Bundle")

        tried = []
        for c in candidates:
            tried.append(str(c))
            target = c.resolve()
            if target.exists() and (target / "src").exists():
                logger.info("Bundle auto-discovered", path=str(target))
                return target

        legacy = Path(r"E:\PraveenFrankly\Databricks\Accelerators\Retail\Product-recommendation\ProductRecommendation-Bundle")
        if legacy.exists() and (legacy / "src").exists():
            logger.info("Bundle discovered via legacy hardcoded fallback path")
            return legacy

        logger.warning("Bundle not found via auto-discovery. Set RECOMMENDATION_BUNDLE_PATH.", tried=tried)
        return None

    def _generate_fallback(self, customer_id: str, surface: str, limit: int) -> Dict[str, Any]:
        recs = MOCK_PRODUCTS_DATA[:limit]
        if surface == "CART":
            recs = [r for r in recs if r["relationship"] in ("COMPLEMENTARY", "ACCESSORY")]
        elif surface == "PRODUCT_PAGE":
            recs = [dict(r, relationship="SIMILAR" if idx % 2 == 0 else "ALTERNATIVE") for idx, r in enumerate(recs)]

        concepts = [
            {"concept": "Wireless productivity", "relationship": "COMPLEMENTARY", "reason": "Based on office searches"},
            {"concept": "Premium noise cancelling audio", "relationship": "SIMILAR", "reason": "Based on headphone views"}
        ]

        return {
            "request_id": str(uuid.uuid4()),
            "customer_id": customer_id,
            "surface": surface,
            "context_summary": f"Mock context: {customer_id} on {surface}",
            "concepts": concepts,
            "recommendations": recs,
            "latency_ms": 150
        }


recommendation_service = RecommendationService()
