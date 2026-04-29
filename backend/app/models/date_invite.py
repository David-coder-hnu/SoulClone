import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, DECIMAL, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class DateInvite(Base, TimestampMixin):
    __tablename__ = "date_invites"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False
    )
    proposer_clone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clones.id"), nullable=False
    )
    proposer_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    invitee_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    proposed_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    proposed_location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    proposed_lat: Mapped[float | None] = mapped_column(DECIMAL(10, 8), nullable=True)
    proposed_lng: Mapped[float | None] = mapped_column(DECIMAL(11, 8), nullable=True)

    status: Mapped[str] = mapped_column(
        Enum("pending", "accepted", "declined", "cancelled", name="date_invite_status"),
        default="pending",
    )
    ai_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    clone_confidence: Mapped[float | None] = mapped_column(DECIMAL(3, 2), nullable=True)
    user_decision: Mapped[str | None] = mapped_column(String(20), nullable=True)
