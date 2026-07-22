"""
Customers API endpoints
"""

from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, List, Dict, Any
from app.services.databricks_service import databricks_service, _run_sql
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/customers", tags=["customers"])

# Static Switcher Personas matching WF-08 and Phase 2.7
DEMO_PERSONAS = [
    {
        "customer_id": "CUST-FRANK-001",
        "customer_name": "Frank",
        "persona_label": "Tech Enthusiast",
        "city": "Bengaluru",
        "avatar_url": "",
    },
    {
        "customer_id": "CUST-SOPHIA-002",
        "customer_name": "Sophia Johnson",
        "persona_label": "Home & Kitchen Explorer",
        "city": "Mumbai",
        "avatar_url": "",
    },
    {
        "customer_id": "CUST-DANIEL-003",
        "customer_name": "Daniel Lee",
        "persona_label": "Mobile Accessories Pro",
        "city": "Delhi",
        "avatar_url": "",
    },
    {
        "customer_id": "CUST-PRIYA-004",
        "customer_name": "Priya Sharma",
        "persona_label": "Lifestyle & Wellness",
        "city": "Chennai",
        "avatar_url": "",
    },
    {
        "customer_id": "CUST-MICHAEL-005",
        "customer_name": "Michael Brown",
        "persona_label": "Office & Productivity Expert",
        "city": "Kolkata",
        "avatar_url": "",
    }
]


@router.get("")
async def get_customers():
    """Get list of active switcher customer personas for demo testing."""
    return {"customers": DEMO_PERSONAS}


@router.get("/{customer_id}/profile")
async def get_customer_profile(customer_id: str):
    """Get active customer profile from gold_customer_context."""
    try:
        # Check if it matches our demo personas to get details
        persona = next((p for p in DEMO_PERSONAS if p["customer_id"] == customer_id), None)
        
        # Try fetching from Databricks SQL Warehouse gold_customer_context
        sql = f"""
            SELECT *
            FROM `{settings.unity_catalog_name}`.`{settings.unity_schema_name}`.`gold_customer_context`
            WHERE customer_id = '{customer_id}'
            LIMIT 1
        """
        rows = []
        if settings.is_databricks_configured and settings.sql_warehouse_id:
            try:
                rows = _run_sql(sql)
            except Exception as e:
                logger.warning("Could not execute customer profile query on Databricks", error=str(e))
                
        if rows:
            row = rows[0]
            # Convert list fields safely from string format if needed
            interests = row.get("interests") or []
            if isinstance(interests, str):
                interests = [i.strip() for i in interests.split(",") if i.strip()]
            recent_searches = row.get("recent_searches") or []
            if isinstance(recent_searches, str):
                recent_searches = [s.strip() for s in recent_searches.split(",") if s.strip()]
                
            return {
                "customer_id": customer_id,
                "customer_name": row.get("customer_name") or (persona["customer_name"] if persona else "Demo Customer"),
                "persona_label": row.get("persona_label") or (persona["persona_label"] if persona else "Visitor"),
                "city": row.get("city") or (persona["city"] if persona else "Bengaluru"),
                "region": row.get("region") or "Karnataka, India",
                "interests": interests or ["Computers", "Electronics", "Audio"],
                "recent_searches": recent_searches or ["wireless keyboard", "usb-c hub"],
                "recently_viewed": [],
                "cart_product_ids": []
            }
            
        # Fallback to local structured profile
        if persona:
            return {
                **persona,
                "region": "Karnataka, India",
                "interests": ["Computers & Laptops", "Audio", "Office Tools"] if customer_id == "CUST-FRANK-001" else ["Home Improvement", "Kitchen Tools"] if customer_id == "CUST-SOPHIA-002" else ["Mobile Gadgets", "Wireless Accessories"] if customer_id == "CUST-DANIEL-003" else ["Lifestyle", "Personal Care"] if customer_id == "CUST-PRIYA-004" else ["Office Furniture", "Desk Items"],
                "recent_searches": ["wireless keyboard", "laptop stand", "USB-C hub"] if customer_id == "CUST-FRANK-001" else ["coffee maker", "blender"] if customer_id == "CUST-SOPHIA-002" else ["phone charger", "screen protector"] if customer_id == "CUST-DANIEL-003" else ["yoga mat", "essential oils"] if customer_id == "CUST-PRIYA-004" else ["mesh chair", "filing cabinet"],
                "recently_viewed": [],
                "cart_product_ids": []
            }
            
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer '{customer_id}' not found",
        )
    except Exception as e:
        logger.error("Failed to fetch customer profile", customer_id=customer_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve customer profile",
        )


@router.get("/{customer_id}/context")
async def get_customer_context(customer_id: str):
    """Get active AI context state summary for WF-08 transparency display."""
    try:
        profile = await get_customer_profile(customer_id)
        # Construct dynamic AI reasoning context overview
        return {
            "top_interests": profile.get("interests", []),
            "preferred_brands": ["Logitech", "Sony", "Apple", "Dell"] if customer_id == "CUST-FRANK-001" else ["Philips", "Morphy Richards", "Prestige"] if customer_id == "CUST-SOPHIA-002" else ["Spigen", "OnePlus", "Anker"] if customer_id == "CUST-DANIEL-003" else ["Forest Essentials", "Decathlon"] if customer_id == "CUST-PRIYA-004" else ["ErgoTune", "Featherlite", "Steelcase"],
            "price_preference": "Mid to Premium (₹5,000 – ₹50,000)" if customer_id in ("CUST-FRANK-001", "CUST-MICHAEL-005") else "Budget to Mid (₹1,000 – ₹10,000)",
            "shopping_behavior": "Researches options thoroughly, reviews rating count, compares specifications" if customer_id == "CUST-FRANK-001" else "Buys bundled packages, values fast delivery",
            "engagement_score": 85 if customer_id == "CUST-FRANK-001" else 72,
            "last_refreshed": "Just now"
        }
    except Exception as e:
        logger.error("Failed to fetch customer context summary", customer_id=customer_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve customer context",
        )
