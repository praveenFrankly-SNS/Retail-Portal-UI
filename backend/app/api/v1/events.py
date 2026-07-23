"""
Customer Behavioral Events API endpoints
"""

import time
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict
from app.services.databricks_service import _run_sql
from app.services.session_service import session_service
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/events", tags=["events"])


class EventPayload(BaseModel):
    customer_id: str
    event_type: str  # SEARCH | PRODUCT_VIEW | RECOMMENDATION_VIEW | RECOMMENDATION_CLICK | ADD_TO_CART | REMOVE_FROM_CART
    product_id: Optional[str] = None
    query: Optional[str] = None
    metadata: Optional[Dict] = None


@router.post("")
async def log_event(event: EventPayload, background_tasks: BackgroundTasks):
    """
    Log a customer behavioral interaction event.
    Persists event telemetry to Databricks gold.customer_event table.
    """
    event_time = int(time.time())
    logger.info("Received customer interaction event", customer_id=event.customer_id, event_type=event.event_type, product_id=event.product_id)

    # If Databricks is unconfigured or warehouse is offline, fallback gracefully
    if not settings.is_databricks_configured or not settings.sql_warehouse_id:
        return {"status": "logged_local_fallback", "timestamp": event_time}

    # Escape inputs safely
    safe_cust_id = event.customer_id.replace("'", "''")
    safe_event_type = event.event_type.replace("'", "''")
    safe_prod_id = (event.product_id or "").replace("'", "''")
    safe_query = (event.query or "").replace("'", "''")

    sql = f"""
        INSERT INTO `{settings.unity_catalog_name}`.`{settings.unity_schema_name}`.`customer_event`
        (customer_id, event_type, product_id, query_text, event_timestamp)
        VALUES
        ('{safe_cust_id}', '{safe_event_type}', '{safe_prod_id}', '{safe_query}', {event_time})
    """

    # Process event into Redis session state
    if event.event_type == 'SEARCH' and event.query:
        session_service.add_recent_search(event.customer_id, event.query)
    elif event.event_type == 'PRODUCT_VIEW' and event.product_id:
        session_service.add_recent_view(event.customer_id, event.product_id)
    elif event.event_type == 'ADD_TO_CART' and event.product_id:
        session_service.add_to_cart(event.customer_id, event.product_id)
    elif event.event_type == 'REMOVE_FROM_CART' and event.product_id:
        session_service.remove_from_cart(event.customer_id, event.product_id)

    def _safe_insert():
        try:
            _run_sql(sql)
        except Exception as e:
            logger.warning("Failed to insert event into Databricks event store, continuing gracefully", error=str(e))

    background_tasks.add_task(_safe_insert)
    return {"status": "success", "timestamp": event_time}
