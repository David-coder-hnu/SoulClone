from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: str,
        type: str,
        title: str,
        content: str | None = None,
        payload: dict | None = None,
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            type=type,
            title=title,
            content=content,
            payload=payload,
        )
        self.db.add(notif)
        await self.db.commit()
        await self.db.refresh(notif)
        return notif

    async def list_for_user(self, user_id: str, unread_only: bool = False):
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read == False)
        query = query.order_by(desc(Notification.created_at))
        result = await self.db.execute(query)
        return result.scalars().all()

    async def mark_read(self, notification_id: str) -> Notification:
        result = await self.db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        notif = result.scalar_one_or_none()
        if notif:
            notif.is_read = True
            await self.db.commit()
            await self.db.refresh(notif)
        return notif
