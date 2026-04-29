from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user_id
from app.services.feed_service import FeedService

router = APIRouter()


@router.get("/")
async def get_feed(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get community feed"""
    service = FeedService(db)
    posts = await service.get_feed(user_id)
    return {"items": posts}
