import random
from uuid import UUID

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.match import Match
from app.models.user import User


class MatchService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def discover(self, user_id: str, limit: int = 10):
        """Discover potential matches for user"""
        result = await self.db.execute(
            select(User).where(User.id != user_id, User.status == "active")
        )
        users = result.scalars().all()

        items = []
        for u in users[:limit]:
            items.append({
                "user_id": str(u.id),
                "nickname": u.nickname,
                "compatibility_score": round(random.uniform(60, 98), 1),
                "match_reason": "兴趣相似，地理位置接近",
            })
        return items

    async def list_matches(self, user_id: str):
        result = await self.db.execute(
            select(Match).where(
                or_(Match.user_a_id == user_id, Match.user_b_id == user_id)
            )
        )
        return result.scalars().all()

    async def create_match(self, user_a_id: str, user_b_id: str, initiated_by: str) -> Match:
        match = Match(
            user_a_id=user_a_id,
            user_b_id=user_b_id,
            compatibility_score=round(random.uniform(60, 98), 1),
            match_reason="AI基于兴趣和地理位置推荐",
            initiated_by=initiated_by,
        )
        self.db.add(match)
        await self.db.commit()
        await self.db.refresh(match)
        return match

    async def update_status(self, match_id: str, status: str) -> Match:
        result = await self.db.execute(select(Match).where(Match.id == match_id))
        match = result.scalar_one_or_none()
        if not match:
            raise ValueError("Match not found")
        match.status = status
        await self.db.commit()
        await self.db.refresh(match)
        return match
