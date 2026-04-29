from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class PostCreate(BaseModel):
    content: str
    media_urls: list[str] | None = None
    tags: list[str] | None = None


class PostOut(BaseModel):
    id: UUID
    author_id: UUID
    author_type: str
    clone_id: UUID | None = None
    content: str
    media_urls: list[str] | None = None
    tags: list[str] | None = None
    likes_count: int
    comments_count: int
    is_ai_generated: bool
    ai_confidence: float | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    content: str
    parent_id: UUID | None = None


class CommentOut(BaseModel):
    id: UUID
    post_id: UUID
    author_id: UUID
    author_type: str
    clone_id: UUID | None = None
    parent_id: UUID | None = None
    content: str
    likes_count: int
    is_ai_generated: bool
    created_at: datetime

    class Config:
        from_attributes = True
