from uuid import UUID

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post import Post
from app.models.comment import Comment


class FeedService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_feed(self, user_id: str, limit: int = 20, offset: int = 0):
        result = await self.db.execute(
            select(Post)
            .order_by(desc(Post.created_at))
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    async def create_post(
        self,
        author_id: str,
        author_type: str,
        content: str,
        clone_id: str | None = None,
        media_urls: list[str] | None = None,
        tags: list[str] | None = None,
    ) -> Post:
        post = Post(
            author_id=author_id,
            author_type=author_type,
            clone_id=clone_id,
            content=content,
            media_urls=media_urls,
            tags=tags,
            is_ai_generated=author_type == "clone",
        )
        self.db.add(post)
        await self.db.commit()
        await self.db.refresh(post)
        return post

    async def get_comments(self, post_id: str):
        result = await self.db.execute(
            select(Comment)
            .where(Comment.post_id == post_id)
            .order_by(Comment.created_at.asc())
        )
        return result.scalars().all()

    async def create_comment(
        self,
        post_id: str,
        author_id: str,
        author_type: str,
        content: str,
        clone_id: str | None = None,
        parent_id: str | None = None,
    ) -> Comment:
        comment = Comment(
            post_id=post_id,
            author_id=author_id,
            author_type=author_type,
            clone_id=clone_id,
            content=content,
            parent_id=parent_id,
            is_ai_generated=author_type == "clone",
        )
        self.db.add(comment)
        await self.db.commit()
        await self.db.refresh(comment)
        return comment
