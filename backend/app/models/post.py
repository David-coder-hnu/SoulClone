import uuid

from sqlalchemy import Text, Integer, Boolean, JSON, ForeignKey, Enum, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin, TimestampMixin


class Post(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "posts"

    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    author_type: Mapped[str] = mapped_column(
        Enum("human", "clone", name="author_type"),
        default="clone",
    )
    clone_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clones.id"), nullable=True
    )

    content: Mapped[str] = mapped_column(Text, nullable=False)
    media_urls: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    tags: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    location_lat: Mapped[float | None] = mapped_column(DECIMAL(10, 8), nullable=True)
    location_lng: Mapped[float | None] = mapped_column(DECIMAL(11, 8), nullable=True)

    likes_count: Mapped[int] = mapped_column(Integer, default=0)
    comments_count: Mapped[int] = mapped_column(Integer, default=0)
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=True)
    ai_confidence: Mapped[float | None] = mapped_column(DECIMAL(3, 2), nullable=True)
