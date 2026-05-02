import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Enum
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin, TimestampMixin


class Takeover(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "takeovers"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("conversations.id"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    clone_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("clones.id"), nullable=True
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reason: Mapped[str] = mapped_column(
        Enum("manual", "date_invite_alert", "clone_uncertain", name="takeover_reason"),
        default="manual",
    )
