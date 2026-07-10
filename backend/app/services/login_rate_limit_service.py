from __future__ import annotations

import hashlib

from app.config import settings
from app.core.redis_client import redis_client


class LoginRateLimitService:
    @staticmethod
    def _key(phone: str) -> str:
        digest = hashlib.sha256(phone.encode("utf-8")).hexdigest()
        return f"auth:login-failures:{digest}"

    async def is_blocked(self, phone: str) -> bool:
        value = await redis_client.get(self._key(phone))
        return int(value or 0) >= settings.LOGIN_MAX_FAILURES

    async def record_failure(self, phone: str) -> int:
        key = self._key(phone)
        failures = await redis_client.incr(key)
        if failures == 1:
            await redis_client.expire(key, settings.LOGIN_FAILURE_WINDOW_SECONDS)
        return failures

    async def clear(self, phone: str) -> None:
        await redis_client.delete(self._key(phone))


login_rate_limiter = LoginRateLimitService()
