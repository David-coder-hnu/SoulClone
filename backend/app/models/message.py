import uuid
from datetime import datetime, timezone

from sqlalchemy import Text, Boolean, DateTime, ForeignKey, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Message(Base, TimestampMixin):
    __tablename__ = "messages"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    sender_type: Mapped[str] = mapped_column(
        Enum("human", "clone", name="sender_type"),
        nullable=False,
    )
    sender_clone_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clones.id"), nullable=True
    )

    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str] = mapped_column(
        Enum("text", "image", "voice", "system", name="content_type"),
        default="text",
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    emotion_tag: Mapped[str | None] = mapped_column(String(20), nullable=True)
    tone_shift: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_takeover_notification: Mapped[bool] = mapped_column(Boolean, default=False)
