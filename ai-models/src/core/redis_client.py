"""
Redis client for caching and job queue
"""

import redis.asyncio as redis
from core.config import settings

# Create Redis client
redis_client = redis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    decode_responses=True
)

async def get_redis():
    """Get Redis client instance"""
    return redis_client