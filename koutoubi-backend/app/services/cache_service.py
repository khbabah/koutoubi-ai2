"""
Cache service for improving performance.
"""

import json
import hashlib
from typing import Optional, Any, Dict
from datetime import datetime, timedelta
import logging
from functools import wraps

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

try:
    from aiocache import Cache, cached
    from aiocache.serializers import JsonSerializer
    AIOCACHE_AVAILABLE = True
except ImportError:
    AIOCACHE_AVAILABLE = False
    Cache = None
    cached = None
    JsonSerializer = None

from app.core.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """Service for caching frequently accessed data."""
    
    def __init__(self):
        self.enabled = settings.CACHE_ENABLED
        self.default_ttl = settings.CACHE_TTL
        self.redis_client = None
        self.memory_cache = None
        self.use_redis = False
        
        if self.enabled:
            if REDIS_AVAILABLE:
                try:
                    # Try to connect to Redis
                    self.redis_client = redis.Redis(
                        host=settings.REDIS_HOST,
                        port=settings.REDIS_PORT,
                        db=settings.REDIS_DB,
                        decode_responses=True
                    )
                    self.redis_client.ping()
                    self.use_redis = True
                    logger.info("Connected to Redis cache")
                except:
                    self.use_redis = False
                    logger.warning("Redis connection failed")
            
            if not self.use_redis and AIOCACHE_AVAILABLE:
                # Fall back to in-memory cache
                self.memory_cache = Cache(Cache.MEMORY, serializer=JsonSerializer())
                logger.info("Using in-memory cache")
            elif not self.use_redis:
                logger.warning("No cache backend available - caching disabled")
                self.enabled = False
        else:
            logger.info("Cache disabled")
    
    def _make_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from prefix and arguments."""
        # Create a unique key from arguments
        key_data = {
            'args': args,
            'kwargs': kwargs
        }
        key_str = json.dumps(key_data, sort_keys=True)
        key_hash = hashlib.md5(key_str.encode()).hexdigest()[:8]
        return f"{prefix}:{key_hash}"
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if not self.enabled:
            return None
            
        try:
            if self.use_redis:
                value = self.redis_client.get(key)
                return json.loads(value) if value else None
            else:
                return await self.memory_cache.get(key)
        except Exception as e:
            logger.error(f"Cache get error: {str(e)}")
            return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[int] = None
    ) -> bool:
        """Set value in cache."""
        if not self.enabled:
            return False
            
        ttl = ttl or self.default_ttl
        
        try:
            if self.use_redis:
                self.redis_client.setex(
                    key, 
                    ttl, 
                    json.dumps(value)
                )
            else:
                await self.memory_cache.set(key, value, ttl=ttl)
            return True
        except Exception as e:
            logger.error(f"Cache set error: {str(e)}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache."""
        if not self.enabled:
            return False
            
        try:
            if self.use_redis:
                self.redis_client.delete(key)
            else:
                await self.memory_cache.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {str(e)}")
            return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern."""
        if not self.enabled:
            return 0
            
        count = 0
        try:
            if self.use_redis:
                for key in self.redis_client.scan_iter(f"{pattern}*"):
                    self.redis_client.delete(key)
                    count += 1
            else:
                # Memory cache doesn't support pattern matching
                await self.memory_cache.clear()
                count = -1  # Unknown count
            return count
        except Exception as e:
            logger.error(f"Cache clear pattern error: {str(e)}")
            return 0
    
    def cache_decorator(
        self, 
        prefix: str, 
        ttl: Optional[int] = None,
        key_builder: Optional[callable] = None
    ):
        """Decorator for caching function results."""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                if not self.enabled:
                    return await func(*args, **kwargs)
                
                # Build cache key
                if key_builder:
                    cache_key = key_builder(*args, **kwargs)
                else:
                    cache_key = self._make_key(prefix, *args, **kwargs)
                
                # Try to get from cache
                cached_value = await self.get(cache_key)
                if cached_value is not None:
                    logger.debug(f"Cache hit: {cache_key}")
                    return cached_value
                
                # Call function and cache result
                result = await func(*args, **kwargs)
                await self.set(cache_key, result, ttl=ttl)
                logger.debug(f"Cache miss and set: {cache_key}")
                
                return result
            
            return wrapper
        return decorator
    
    # Pre-defined cache key prefixes
    COURSE_LIST = "courses:list"
    COURSE_INFO = "courses:info"
    PAGE_CONTENT = "content:page"
    SEARCH_RESULTS = "search:results"
    USER_PROGRESS = "progress:user"
    QUIZ_QUESTIONS = "quiz:questions"
    AI_RESPONSE = "ai:response"
    PDF_SUMMARY = "pdf:summary"


# Singleton instance
cache_service = CacheService()


# Convenience decorators
def cache_course_list(ttl: int = 3600):
    """Cache course list for 1 hour by default."""
    return cache_service.cache_decorator(
        CacheService.COURSE_LIST,
        ttl=ttl
    )


def cache_page_content(ttl: int = 86400):
    """Cache page content for 24 hours by default."""
    def key_builder(niveau, annee, matiere, page):
        return f"{CacheService.PAGE_CONTENT}:{niveau}:{annee}:{matiere}:{page}"
    
    return cache_service.cache_decorator(
        CacheService.PAGE_CONTENT,
        ttl=ttl,
        key_builder=key_builder
    )


def cache_ai_response(ttl: int = 3600):
    """Cache AI responses for 1 hour by default."""
    return cache_service.cache_decorator(
        CacheService.AI_RESPONSE,
        ttl=ttl
    )