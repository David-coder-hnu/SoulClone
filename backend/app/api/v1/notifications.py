from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user_id
from app.schemas.notification import NotificationOut
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("/", response_model=list[NotificationOut])
async def list_notifications(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List user's notifications"""
    service = NotificationService(db)
    items = await service.list_notifications(user_id)
    return items


@router.get("/unread-count")
async def unread_count(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get unread notification count"""
    service = NotificationService(db)
    count = await service.get_unread_count(user_id)
    return {"count": count}


@router.post("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Mark a notification as read"""
    service = NotificationService(db)
    notif = await service.mark_as_read(notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "marked_as_read", "id": notification_id}


@router.post("/read-all")
async def mark_all_read(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read"""
    service = NotificationService(db)
    count = await service.mark_all_as_read(user_id)
    return {"status": "marked_all_as_read", "count": count}
