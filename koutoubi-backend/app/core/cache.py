import json
from typing import Optional, Any
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class CacheManager:
    """Simple in-memory cache manager"""
    
    def __init__(self):
        self._cache = {}
        self._expiry = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        if key not in self._cache:
            return None
        
        if key in self._expiry:
            if datetime.utcnow() > self._expiry[key]:
                # Expired, remove from cache
                del self._cache[key]
                del self._expiry[key]
                return None
        
        logger.debug(f"Cache hit for key: {key}")
        return self._cache[key]
    
    def set(self, key: str, value: Any, ttl: int = 3600):
        """Set value in cache with TTL in seconds"""
        self._cache[key] = value
        self._expiry[key] = datetime.utcnow() + timedelta(seconds=ttl)
        logger.debug(f"Cached key: {key} with TTL: {ttl}s")
    
    def delete(self, key: str):
        """Delete key from cache"""
        if key in self._cache:
            del self._cache[key]
        if key in self._expiry:
            del self._expiry[key]
        logger.debug(f"Deleted cache key: {key}")
    
    def clear(self):
        """Clear all cache"""
        self._cache.clear()
        self._expiry.clear()
        logger.info("Cache cleared")

# Global cache instance
cache_manager = CacheManager()