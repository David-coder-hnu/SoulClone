import uuid
from datetime import datetime

from decimal import Decimal

from sqlalchemy import DECIMAL, JSON, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class CloneReplyJob(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "clone_reply_jobs"
    __table_args__ = (
        UniqueConstraint(
            "source_message_id",
            name="uq_clone_reply_jobs_source_message",
        ),
        UniqueConstraint(
            "idempotency_key",
            name="uq_clone_reply_jobs_idempotency_key",
        ),
    )

    source_message_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("messages.id"), nullable=False, index=True
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("conversations.id"), nullable=False, index=True
    )
    clone_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("clones.id"), nullable=False, index=True
    )
    reply_message_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("messages.id"), nullable=True, unique=True
    )
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="queued", index=True
    )
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    idempotency_key: Mapped[str] = mapped_column(
        String(150), nullable=False
    )
    control_version: Mapped[int] = mapped_column(Integer, nullable=False)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    trace_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, default=uuid.uuid4)
    error_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    risk_level: Mapped[str | None] = mapped_column(String(2), nullable=True)
    risk_categories: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    risk_confidence: Mapped[Decimal | None] = mapped_column(
        DECIMAL(4, 3), nullable=True
    )
    safety_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    approval_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    approval_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    draft_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reviewed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=True
    )
    worker_task_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    lease_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancel_reason: Mapped[str | None] = mapped_column(String(100), nullable=True)
