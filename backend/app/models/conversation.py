import uuid
from datetime import datetime

from sqlalchemy import DECIMAL, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin, TimestampMixin


class Conversation(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "conversations"

    match_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("matches.id"), nullable=True
    )
    participant_a_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    participant_b_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    status: Mapped[str] = mapped_column(
        Enum("active", "paused", "ended", name="conversation_status"),
        default="active",
    )
    intimacy_score: Mapped[float] = mapped_column(DECIMAL(5, 2), default=0.0)
    relationship_stage: Mapped[str] = mapped_column(
        Enum("stranger", "acquaintance", "friend", "close", "intimate", name="relationship_stage"),
        default="stranger",
    )
    last_message_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
