from contextlib import asynccontextmanager
from contextlib import suppress
import asyncio
from json import JSONDecodeError
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.db.session import init_db
from app.api.v1 import auth, users, distillation, clones, matches, conversations, messages, posts, feed, notifications, date_invites, calibration
from app.websocket.manager import manager
from app.websocket.chat_handler import ChatHandler
from app.core.redis_client import redis_client, close_redis
from app.core.realtime_events import run_realtime_event_forwarder
from app.services.clone_reply_dispatcher import shutdown_local_clone_reply_tasks

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    realtime_forwarder = asyncio.create_task(run_realtime_event_forwarder())
    try:
        yield
    finally:
        await shutdown_local_clone_reply_tasks()
        realtime_forwarder.cancel()
        with suppress(asyncio.CancelledError):
            await realtime_forwarder
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
        if (
            not payload
            or "sub" not in payload
            or payload.get("type") != "access"
        ):
            await websocket.close(code=4001, reason="Unauthorized")
            return
        user_id = payload["sub"]
    except Exception:
        await websocket.close(code=4001, reason="Unauthorized")
        return
    
    await manager.connect(websocket, user_id)
    await websocket.send_json(
        {
            "type": "connected",
            "heartbeat_interval_seconds": 25,
        }
    )
    
    from app.db.session import async_session
    async with async_session() as db:
        handler = ChatHandler(db)
        try:
            while True:
                try:
                    data = await websocket.receive_json()
                except JSONDecodeError:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "code": "INVALID_JSON",
                            "message": "Invalid JSON payload",
                        }
                    )
                    continue
                await handler.handle_message(user_id, data)
        except WebSocketDisconnect:
            pass
        except Exception:
            logger.exception("Unexpected WebSocket error", extra={"user_id": user_id})
            try:
                await websocket.close(code=1011, reason="Internal server error")
            except Exception:
                pass
        finally:
            manager.disconnect(websocket, user_id)
