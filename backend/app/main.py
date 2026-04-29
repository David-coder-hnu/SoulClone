from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.session import init_db
from app.middleware.auth import AuthMiddleware
from app.api.v1 import auth, users, distillation, clones, matches, conversations, messages, posts, feed, notifications, date_invites
from app.websocket.manager import manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="AI克隆分身社交平台",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth middleware
app.add_middleware(AuthMiddleware)

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


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}


@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    # Accept without auth for now; production should validate token
    await manager.connect(websocket, "anonymous")
    try:
        while True:
            data = await websocket.receive_json()
            # Echo back for now; production routes to chat_handler
            await manager.send_personal_message(data, "anonymous")
    except WebSocketDisconnect:
        manager.disconnect(websocket, "anonymous")
