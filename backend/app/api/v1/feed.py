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
    # Hide author_type to preserve anonymity
    sanitized = []
    for post in posts:
        p = {
            "id": str(post.id),
            "author_id": str(post.author_id),
            "content": post.content,
            "media_urls": post.media_urls,
            "tags": post.tags,
            "likes_count": post.likes_count,
            "comments_count": post.comments_count,
            "created_at": post.created_at.isoformat() if post.created_at else None,
        }
        sanitized.append(p)
    return {"items": sanitized}
