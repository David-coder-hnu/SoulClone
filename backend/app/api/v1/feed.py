import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.dependencies import get_db, get_current_user_id
from app.models.user import User
from app.services.feed_service import FeedService

router = APIRouter()


@router.get("")
@router.get("/")
async def get_feed(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get community feed"""
    service = FeedService(db)
    posts = await service.get_feed(user_id)

    # Collect author IDs for batch lookup
    author_ids = {str(p.author_id) for p in posts}
    authors = {}
    if author_ids:
        result = await db.execute(select(User).where(User.id.in_(list(author_ids))))
        for u in result.scalars().all():
            authors[str(u.id)] = u

    sanitized = []
    for post in posts:
        author = authors.get(str(post.author_id))
        p = {
            "id": str(post.id),
            "author_id": str(post.author_id),
            "content": post.content,
            "media_urls": post.media_urls,
            "tags": post.tags,
            "likes_count": post.likes_count,
            "comments_count": post.comments_count,
            "created_at": post.created_at.isoformat() if post.created_at else None,
            "author_nickname": author.nickname if author else None,
            "author_avatar": author.avatar_url if author else None,
            "is_twin_post": post.author_type == "clone",
        }
        sanitized.append(p)
    return {"items": sanitized}


@router.post("/posts")
async def create_post(
    content: str,
    tags: list[str] | None = None,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new community post"""
    service = FeedService(db)
    post = await service.create_post(
        author_id=str(user_id),
        author_type="human",
        content=content,
        tags=tags or [],
    )
    return {
        "id": str(post.id),
        "content": post.content,
        "tags": post.tags,
        "created_at": post.created_at.isoformat() if post.created_at else None,
    }
