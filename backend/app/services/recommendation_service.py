"""
Recommendation Gateway Service
FastAPI Backend — Retail AI Portal
"""

import time
import uuid
import requests
from typing import Dict, List, Optional, Any
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Fallback recommendations if Databricks serving endpoint is offline or credentials missing
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
    """Service to orchestrate Phase 7 Common-Sense Recommendation Engine locally."""

    async def get_recommendations(
        self,
        customer_id: str,
        surface: str,
        current_product_id: Optional[str] = None,
        limit: int = 8,
        session_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Execute Phase 7 recommendation pipeline using Databricks REST APIs for data,
        LLM reasoning, and Vector Search indexing.
        """
        start_time = time.time()
        
        # 1. Fallback check if credentials are missing
        if not settings.is_databricks_configured:
            logger.warning("Databricks credentials missing — falling back to mock recommendations")
            return self._generate_fallback(customer_id, surface, limit)

        # 2. Add bundle to path and import engine components
        import os
        import sys
        from pathlib import Path
        
        bundle_path = Path("E:/PraveenFrankly/Databricks/Accelerators/Retail/Product-recommendation/ProductRecommendation-Bundle")
        if str(bundle_path) not in sys.path:
            sys.path.insert(0, str(bundle_path))
            
        try:
            from src.config.loader import AcceleratorConfig
            from src.recommendation.repositories.sql_customer_context_repository import SqlCustomerContextRepository
            from src.recommendation.recommendation_service import generate_recommendations
            
            # 3. Setup credentials for downstream REST / SDK clients
            clean_host = settings.databricks_host.replace("https://", "").replace("http://", "")
            os.environ["DATABRICKS_HOST"] = clean_host
            os.environ["DATABRICKS_TOKEN"] = settings.resolved_token
            
            # Load bundle configuration
            config = AcceleratorConfig()
            warehouse_id = settings.sql_warehouse_id or config.serving.get("warehouse_id", "")
            catalog = config.catalog
            gold_schema = config.gold_schema
            
            # Initialize SQL context repository (Statement execution layer)
            repository = SqlCustomerContextRepository(
                databricks_host=f"https://{clean_host}",
                token=settings.resolved_token,
                warehouse_id=warehouse_id,
                catalog=catalog,
                gold_schema=gold_schema
            )
            
            # 4. Generate recommendations using Phase 7 orchestration engine
            logger.info("Executing Phase 7 recommendation pipeline locally", customer_id=customer_id, surface=surface)
            engine_response = generate_recommendations(
                spark=repository,
                customer_id=customer_id,
                surface=surface,
                config=config,
                current_product_id=current_product_id,
                limit=limit,
                session_context=session_context
            )
            
            # 5. Enrich candidates with price/image/rating fallbacks for premium React rendering
            enriched_recs = []
            for rec in engine_response.get("recommendations", []):
                # Retrieve price from metadata, price_tier, or fallback
                price_tier = rec.get("price_tier", "MEDIUM").upper()
                if rec.get("price"):
                    price = float(rec["price"])
                else:
                    if "LOW" in price_tier:
                        price = 1499
                    elif "HIGH" in price_tier:
                        price = 24990
                    else:
                        price = 7699
                
                # Fetch image from catalog, or generate beautiful Unsplash electronics images
                raw_image = rec.get("image_url", "")
                if raw_image and raw_image.startswith("http"):
                    img = raw_image
                else:
                    prod_name = rec.get("product_name", "").lower()
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
                    "product_id": rec.get("product_id"),
                    "product_name": rec.get("product_name"),
                    "brand": rec.get("brand_name") or rec.get("brand") or "Generic",
                    "price": price,
                    "rating": float(rec.get("rating", 4.5)),
                    "rating_count": int(rec.get("rating_count", 850)),
                    "image_url": img,
                    "relationship": rec.get("relationship"),
                    "concept": rec.get("concept"),
                    "final_score": float(rec.get("final_score", 0.0)),
                    "reason": rec.get("reason")
                })
                
            latency_ms = int((time.time() - start_time) * 1000)
            logger.info("Local recommendations completed", count=len(enriched_recs), latency_ms=latency_ms)
            
            return {
                "request_id": engine_response.get("request_id"),
                "customer_id": customer_id,
                "surface": surface,
                "context_summary": engine_response.get("context_summary"),
                "concepts": engine_response.get("concepts", []),
                "recommendations": enriched_recs,
                "latency_ms": latency_ms
            }
            
        except Exception as e:
            logger.error("Failed executing local Phase 7 pipeline, triggering fallback", error=str(e))
            return self._generate_fallback(customer_id, surface, limit)

    def _generate_fallback(self, customer_id: str, surface: str, limit: int) -> Dict[str, Any]:
        """Generate static mock payload matching the verified serving contract."""
        recs = MOCK_PRODUCTS_DATA[:limit]
        
        # Adjust relationship filters depending on the surface
        if surface == "CART":
            recs = [r for r in recs if r["relationship"] in ("COMPLEMENTARY", "ACCESSORY")]
        elif surface == "PRODUCT_PAGE":
            # For PDP, map relationships to similar/alternatives
            recs = [dict(r, relationship="SIMILAR" if idx % 2 == 0 else "ALTERNATIVE") for idx, r in enumerate(recs)]
            
        concepts = [
            {"concept": "Wireless productivity", "relationship": "COMPLEMENTARY", "reason": "Based on office searches"},
            {"concept": "Premium noise cancelling audio", "relationship": "SIMILAR", "reason": "Based on headphone views"}
        ]

        return {
            "request_id": str(uuid.uuid4()),
            "customer_id": customer_id,
            "surface": surface,
            "context_summary": f"Fallback context: {customer_id} on {surface}",
            "concepts": concepts,
            "recommendations": recs,
            "latency_ms": 150
        }


recommendation_service = RecommendationService()
