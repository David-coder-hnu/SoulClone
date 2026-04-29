
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clone import Clone


class CloneService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user_id(self, user_id: str) -> Clone | None:
        result = await self.db.execute(select(Clone).where(Clone.user_id == user_id))
        return result.scalar_one_or_none()

    async def activate(self, user_id: str) -> Clone:
        clone = await self.get_by_user_id(user_id)
        if not clone:
            raise ValueError("Clone not found")
        clone.status = "active"
        await self.db.commit()
        await self.db.refresh(clone)
        return clone

    async def deactivate(self, user_id: str) -> Clone:
        clone = await self.get_by_user_id(user_id)
        if not clone:
            raise ValueError("Clone not found")
        clone.status = "dormant"
        await self.db.commit()
        await self.db.refresh(clone)
        return clone

    async def update_config(self, user_id: str, **kwargs) -> Clone:
        clone = await self.get_by_user_id(user_id)
        if not clone:
            raise ValueError("Clone not found")
        for key, value in kwargs.items():
            if hasattr(clone, key) and value is not None:
                setattr(clone, key, value)
        await self.db.commit()
        await self.db.refresh(clone)
        return clone
