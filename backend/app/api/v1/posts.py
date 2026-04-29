from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user_id
from app.schemas.post import PostCreate, PostOut, CommentCreate, CommentOut
from app.services.feed_service import FeedService

router = APIRouter()


@router.post("/", response_model=PostOut)
async def create_post(
    data: PostCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new post (human or clone)"""
    service = FeedService(db)
    post = await service.create_post(
        author_id=user_id,
        author_type="human",
        content=data.content,
        media_urls=data.media_urls,
        tags=data.tags,
    )
    return post


@router.get("/{post_id}/comments")
async def get_comments(
    post_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get comments for a post"""
    service = FeedService(db)
    comments = await service.get_comments(post_id)
    return {"items": comments}


@router.post("/{post_id}/comments")
async def create_comment(
    post_id: str,
    data: CommentCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Add a comment"""
    service = FeedService(db)
    comment = await service.create_comment(
        post_id=post_id,
        author_id=user_id,
        author_type="human",
        content=data.content,
        parent_id=data.parent_id,
    )
    return comment
