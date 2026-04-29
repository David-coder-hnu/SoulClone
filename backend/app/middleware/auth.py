from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.security import decode_token


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.state.user_id = None
        auth = request.headers.get("authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth[7:]
            payload = decode_token(token)
            if payload and "sub" in payload:
                request.state.user_id = payload["sub"]
        response = await call_next(request)
        return response
