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
    """Service to proxy requests to Databricks Model Serving for recommendations."""

    async def get_recommendations(
        self,
        customer_id: str,
        surface: str,
        current_product_id: Optional[str] = None,
        limit: int = 8,
        session_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Query Databricks Model Serving endpoint. Fallback to mock data if offline/unconfigured.
        """
        start_time = time.time()
        
        # 1. Fallback check if credentials are missing
        if not settings.is_databricks_configured or not settings.recommendation_endpoint:
            logger.warning("Databricks model serving not configured — falling back to mock recommendations")
            return self._generate_fallback(customer_id, surface, limit)

        url = f"{settings.databricks_url}/api/2.0/serving-endpoints/{settings.recommendation_endpoint}/invocations"
        headers = {
            "Authorization": f"Bearer {settings.resolved_token}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "dataframe_records": [
                {
                    "customer_id": customer_id,
                    "surface": surface,
                    "current_product_id": current_product_id,
                    "limit": limit,
                    "session_context": session_context or {}
                }
            ]
        }

        try:
            # Query the serving endpoint
            resp = requests.post(url, headers=headers, json=payload, timeout=8.0)
            resp.raise_for_status()
            result = resp.json()
            
            # Databricks endpoint returns list of predictions in "predictions" key
            predictions = result.get("predictions")
            if predictions and len(predictions) > 0:
                pred = predictions[0]
                pred["latency_ms"] = int((time.time() - start_time) * 1000)
                logger.info("Recommendations retrieved from Databricks serving", customer_id=customer_id, surface=surface, latency_ms=pred["latency_ms"])
                return pred
            else:
                logger.warning("Databricks serving returned empty predictions array")
                return self._generate_fallback(customer_id, surface, limit)

        except Exception as e:
            logger.error("Failed to fetch serving recommendations, invoking fallback", error=str(e))
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
