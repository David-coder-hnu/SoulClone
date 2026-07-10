import uuid
from datetime import datetime

from sqlalchemy import Text, Boolean, DateTime, ForeignKey, Enum, String, UniqueConstraint
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin, TimestampMixin


class Message(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "messages"
    __table_args__ = (
        UniqueConstraint(
            "sender_id",
            "client_message_id",
            name="uq_messages_sender_client_message",
        ),
    )

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("conversations.id"), nullable=False
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    sender_type: Mapped[str] = mapped_column(
        Enum("human", "clone", name="sender_type"),
        nullable=False,
    )
    sender_clone_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("clones.id"), nullable=True
    )
    client_message_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, nullable=True, index=True
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
    delivery_status: Mapped[str] = mapped_column(
        Enum(
            "persisted",
            "delivered",
            "read",
            "failed",
            name="message_delivery_status",
        ),
        default="persisted",
        nullable=False,
    )
