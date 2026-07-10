from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.db.session import init_db
from app.api.v1 import auth, users, distillation, clones, matches, conversations, messages, posts, feed, notifications, date_invites, calibration
from app.websocket.manager import manager
from app.websocket.chat_handler import ChatHandler
from app.core.redis_client import redis_client, close_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    try:
        yield
    finally:
        await close_redis()


app = FastAPI(
    title=settings.APP_NAME,
    description="AI克隆分身社交平台",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(distillation.router, prefix="/api/v1/distillation", tags=["distillation"])
app.include_router(clones.router, prefix="/api/v1/clones", tags=["clones"])
app.include_router(matches.router, prefix="/api/v1/matches", tags=["matches"])
app.include_router(conversations.router, prefix="/api/v1/conversations", tags=["conversations"])
app.include_router(messages.router, prefix="/api/v1/messages", tags=["messages"])
app.include_router(posts.router, prefix="/api/v1/posts", tags=["posts"])
app.include_router(feed.router, prefix="/api/v1/feed", tags=["feed"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(date_invites.router, prefix="/api/v1/date-invites", tags=["date-invites"])
app.include_router(calibration.router, prefix="/api/v1/calibration", tags=["calibration"])


@app.get("/health")
async def health():
    """Readiness check for the API and its required data services."""
    checks: dict[str, str] = {}

    try:
        from app.db.session import async_session

        async with async_session() as db:
            await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "unavailable"

    try:
        await redis_client.ping()
        checks["redis"] = "ok"
    except Exception:
        checks["redis"] = "unavailable"

    status = "ok" if all(value == "ok" for value in checks.values()) else "degraded"
    return {
        "status": status,
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "checks": checks,
    }


@app.get("/health/live")
async def liveness():
    """Liveness check that does not depend on external services."""
    return {"status": "ok", "app": settings.APP_NAME}


@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket, token: str = Query(...)):
    
    try:
        from app.core.security import decode_token
        payload = decode_token(token)
        if not payload or "sub" not in payload:
            await websocket.close(code=4001, reason="Unauthorized")
            return
        user_id = payload["sub"]
    except Exception:
        await websocket.close(code=4001, reason="Unauthorized")
        return
    
    await manager.connect(websocket, user_id)
    
    from app.db.session import async_session
    async with async_session() as db:
        handler = ChatHandler(db)
        try:
            while True:
                data = await websocket.receive_json()
                await handler.handle_message(user_id, data)
        except WebSocketDisconnect:
            manager.disconnect(websocket, user_id)
