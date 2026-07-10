import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class ConversationControl(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "conversation_controls"
    __table_args__ = (
        UniqueConstraint(
            "conversation_id",
            "user_id",
            name="uq_conversation_controls_conversation_user",
        ),
    )

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("conversations.id"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False, index=True
    )
    mode: Mapped[str] = mapped_column(
        Enum(
            "clone_active",
            "human_active",
            "clone_cooldown",
            "paused",
            "blocked",
            name="conversation_control_mode",
        ),
        nullable=False,
        default="clone_active",
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    changed_by: Mapped[str] = mapped_column(
        Enum("human", "system", "admin", name="conversation_control_actor"),
        nullable=False,
        default="system",
    )
    reason: Mapped[str | None] = mapped_column(String(100), nullable=True)
