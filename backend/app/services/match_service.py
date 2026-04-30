import random

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.match import Match
from app.models.user import User
from app.services.notification_service import NotificationService


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
            # Compute age from birth_date if available
            age = 0
            if u.birth_date:
                from datetime import date
                today = date.today()
                born = u.birth_date.date() if hasattr(u.birth_date, "date") else u.birth_date
                age = today.year - born.year - ((today.month, today.day) < (born.month, born.day))

            items.append({
                "id": str(u.id),
                "nickname": u.nickname or "用户",
                "age": age,
                "city": u.location_city or "",
                "bio": u.bio or "",
                "tags": [],
                "traits": {},
                "distance": "附近",
                "avatar": u.avatar_url,
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

        # Notify the matched user
        notif_service = NotificationService(self.db)
        await notif_service.create_notification(
            user_id=user_b_id,
            type="match",
            title="新的匹配",
            content=f"AI 为你推荐了一位新朋友，兼容度 {match.compatibility_score}%",
            payload={"match_id": str(match.id), "compatibility_score": match.compatibility_score},
        )

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
