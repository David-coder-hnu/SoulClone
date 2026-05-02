"""
Shared Redis client for caching, progress tracking, and pub/sub.
Development uses fakeredis (in-memory). Production uses real Redis.
"""

from __future__ import annotations

from app.config import settings

if settings.use_memory_redis:
    import fakeredis.aioredis as _aioredis

    redis_client = _aioredis.FakeRedis()
else:
    from redis import asyncio as _aioredis

    redis_client = _aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )


async def close_redis() -> None:
    if not settings.use_memory_redis:
        await redis_client.close()
