import uuid
import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.db.session import async_session
from app.core.security import decode_token

security = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> uuid.UUID:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )
    payload = decode_token(credentials.credentials)
    if (
        not payload
        or "sub" not in payload
        or payload.get("type") != "access"
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    try:
        return uuid.UUID(payload["sub"])
    except (TypeError, ValueError):
        logger.warning("Rejected token with an invalid subject")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from None
