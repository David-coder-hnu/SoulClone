from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token,
)
from app.models.refresh_token import RefreshToken


class InvalidRefreshTokenError(Exception):
    pass


class TokenService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def issue_pair(self, user_id: uuid.UUID) -> tuple[str, str]:
        access_token = create_access_token(str(user_id))
        refresh_token = create_refresh_token(str(user_id))
        self.db.add(self._build_session(user_id, refresh_token))
        await self.db.commit()
        return access_token, refresh_token

    async def rotate(self, raw_token: str) -> tuple[str, str]:
        payload = decode_token(raw_token)
        if (
            not payload
            or payload.get("type") != "refresh"
            or not payload.get("sub")
            or not payload.get("jti")
        ):
            raise InvalidRefreshTokenError

        try:
            user_id = uuid.UUID(payload["sub"])
        except (TypeError, ValueError):
            raise InvalidRefreshTokenError from None

        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == hash_token(raw_token),
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
        )
        current = result.scalar_one_or_none()
        if current is None:
            raise InvalidRefreshTokenError

        new_refresh_token = create_refresh_token(str(user_id))
        replacement = self._build_session(user_id, new_refresh_token)
        self.db.add(replacement)
        await self.db.flush()

        current.revoked_at = datetime.now(timezone.utc)
        current.replaced_by_token_id = replacement.id
        await self.db.commit()

        return create_access_token(str(user_id)), new_refresh_token

    async def revoke(self, raw_token: str) -> None:
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == hash_token(raw_token),
                RefreshToken.revoked_at.is_(None),
            )
        )
        token = result.scalar_one_or_none()
        if token is not None:
            token.revoked_at = datetime.now(timezone.utc)
            await self.db.commit()

    @staticmethod
    def _build_session(user_id: uuid.UUID, raw_token: str) -> RefreshToken:
        payload = decode_token(raw_token)
        if not payload or not payload.get("exp"):
            raise InvalidRefreshTokenError
        return RefreshToken(
            user_id=user_id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
        )
