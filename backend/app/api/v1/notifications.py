import asyncio
import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user_id
from app.schemas.notification import NotificationOut

router = APIRouter()


@router.get("/")
async def list_notifications(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List notifications"""
    return {"items": []}


@router.get("/stream")
async def notification_stream(
    user_id: str = Depends(get_current_user_id),
):
    """SSE stream for real-time notifications"""

    async def event_generator():
        while True:
            await asyncio.sleep(15)
            payload = json.dumps({"type": "ping", "user_id": user_id})
            yield f"event: ping\ndata: {payload}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
