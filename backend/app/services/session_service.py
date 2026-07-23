"""
Session Service for managing live customer context in Redis
"""
from typing import List, Dict, Optional
from redis import Redis
from redis.exceptions import RedisError
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

class SessionService:
    def __init__(self):
        if settings.cache_enabled:
            try:
                self.redis = Redis(
                    host=settings.redis_host,
                    port=settings.redis_port,
                    db=settings.redis_db,
                    password=settings.redis_password if settings.redis_password else None,
                    decode_responses=True,
                    socket_timeout=2
                )
                self.redis.ping()
                self.enabled = True
                logger.info("Session service connected to Redis", host=settings.redis_host)
            except RedisError as e:
                logger.warning("Session service failed to connect to Redis", error=str(e))
                self.enabled = False
        else:
            self.enabled = False
            logger.info("Session service disabled (CACHE_ENABLED=False)")
            
    def _key(self, customer_id: str, suffix: str) -> str:
        return f"customer:{customer_id}:{suffix}"
        
    def add_recent_search(self, customer_id: str, query: str):
        if not self.enabled or not query:
            return
        key = self._key(customer_id, "recent_searches")
        try:
            self.redis.lrem(key, 0, query) # Remove duplicates
            self.redis.lpush(key, query)
            self.redis.ltrim(key, 0, 9) # Keep last 10
            self.redis.expire(key, 86400 * 7) # 7 days
        except RedisError as e:
            logger.warning("Failed to add recent search", error=str(e))

    def add_recent_view(self, customer_id: str, product_id: str):
        if not self.enabled or not product_id:
            return
        key = self._key(customer_id, "recent_views")
        try:
            self.redis.lrem(key, 0, product_id)
            self.redis.lpush(key, product_id)
            self.redis.ltrim(key, 0, 19) # Keep last 20
            self.redis.expire(key, 86400 * 7)
        except RedisError as e:
            logger.warning("Failed to add recent view", error=str(e))
            
    def add_to_cart(self, customer_id: str, product_id: str):
        if not self.enabled or not product_id:
            return
        key = self._key(customer_id, "cart")
        try:
            self.redis.sadd(key, product_id)
            self.redis.expire(key, 86400 * 7)
        except RedisError as e:
            logger.warning("Failed to add to cart", error=str(e))

    def remove_from_cart(self, customer_id: str, product_id: str):
        if not self.enabled or not product_id:
            return
        key = self._key(customer_id, "cart")
        try:
            self.redis.srem(key, product_id)
        except RedisError as e:
            logger.warning("Failed to remove from cart", error=str(e))

    def get_customer_context(self, customer_id: str) -> Dict[str, List[str]]:
        if not self.enabled:
            return {"recent_searches": [], "recent_views": [], "cart": []}
            
        try:
            searches = self.redis.lrange(self._key(customer_id, "recent_searches"), 0, -1)
            views = self.redis.lrange(self._key(customer_id, "recent_views"), 0, -1)
            cart = list(self.redis.smembers(self._key(customer_id, "cart")))
            return {
                "recent_searches": searches,
                "recent_views": views,
                "cart": cart
            }
        except RedisError as e:
            logger.warning("Failed to retrieve customer context from Redis", error=str(e))
            return {"recent_searches": [], "recent_views": [], "cart": []}

session_service = SessionService()
