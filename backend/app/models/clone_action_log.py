from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin

if TYPE_CHECKING:
    pass


class CloneActionLog(Base, UUIDMixin):
    __tablename__ = "clone_action_logs"

    clone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clones.id"), nullable=False
    )
    action_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # reply / match / post / activate / deactivate / etc
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
