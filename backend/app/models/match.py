import uuid
from datetime import datetime, timezone

from sqlalchemy import DECIMAL, Text, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Match(Base, TimestampMixin):
    __tablename__ = "matches"

    user_a_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    user_b_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    clone_a_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clones.id"), nullable=True
    )
    clone_b_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clones.id"), nullable=True
    )

    compatibility_score: Mapped[float] = mapped_column(DECIMAL(5, 2), nullable=False)
    match_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("pending", "accepted", "rejected", "expired", name="match_status"),
        default="pending",
    )
    initiated_by: Mapped[str] = mapped_column(
        Enum("human_a", "human_b", "clone_a", "clone_b", name="initiated_by"),
        nullable=False,
    )

    accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
