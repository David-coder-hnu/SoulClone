from __future__ import annotations
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, DECIMAL, DateTime, JSON, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.clone_profile import CloneProfile


class Clone(Base, TimestampMixin):
    __tablename__ = "clones"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )
    profile_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clone_profiles.id"), nullable=True
    )

    name: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("dormant", "active", "learning", name="clone_status"),
        default="dormant",
    )

    # Stats
    total_conversations: Mapped[int] = mapped_column(Integer, default=0)
    total_messages_sent: Mapped[int] = mapped_column(Integer, default=0)
    total_matches: Mapped[int] = mapped_column(Integer, default=0)
    total_posts: Mapped[int] = mapped_column(Integer, default=0)
    total_comments: Mapped[int] = mapped_column(Integer, default=0)
    avg_response_time_sec: Mapped[int | None] = mapped_column(Integer, nullable=True)
    success_rate: Mapped[float | None] = mapped_column(DECIMAL(5, 2), nullable=True)

    # Emotional state
    current_mood: Mapped[str | None] = mapped_column(String(20), nullable=True)
    active_relationships: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    memory_summaries: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    last_activity_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="clone")
    profile: Mapped["CloneProfile"] = relationship("CloneProfile", back_populates="clone")
