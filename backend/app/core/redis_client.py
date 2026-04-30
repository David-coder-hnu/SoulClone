"""
Shared Redis client for caching, progress tracking, and pub/sub.
"""

from __future__ import annotations

import redis.asyncio as aioredis

from app.config import settings

redis_client: aioredis.Redis = aioredis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
)


async def close_redis() -> None:
    await redis_client.close()
