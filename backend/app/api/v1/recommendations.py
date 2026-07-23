"""
Recommendations API endpoints
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict
from app.services.recommendation_service import recommendation_service
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class RecommendationRequest(BaseModel):
    customer_id: str
    surface: str
    current_product_id: Optional[str] = None
    limit: Optional[int] = 8
    session_context: Optional[Dict] = None


@router.post("")
def get_recommendations(request: RecommendationRequest):
    """
    Get personalized recommendations for a customer on a given surface.
    Pass real-time session_context in body to affect recommendations instantly.
    """
    try:
        res = recommendation_service.get_recommendations(
            customer_id=request.customer_id,
            surface=request.surface,
            current_product_id=request.current_product_id,
            limit=request.limit or 8,
            session_context=request.session_context
        )
        if isinstance(res, dict) and res.get("status") == "error":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=res.get("message") or "Recommendation service error"
            )
        return res
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to process recommendation request", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recommendations",
        )
