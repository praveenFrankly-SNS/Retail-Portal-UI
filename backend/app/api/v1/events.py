"""
Customer Behavioral Events API endpoints
"""

import time
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict
from app.services.databricks_service import _run_sql
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
async def log_event(event: EventPayload):
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

    try:
        # Run asynchronous insert statement
        # Note: If the customer_event table schema doesn't exist, this will trigger the except block and continue gracefully.
        _run_sql(sql)
        return {"status": "success", "timestamp": event_time}
    except Exception as e:
        logger.warning("Failed to insert event into Databricks event store, continuing gracefully", error=str(e))
        return {"status": "logged_local_fallback", "timestamp": event_time}
