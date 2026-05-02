from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    pass


class CloneActionLog(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "clone_action_logs"

    clone_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("clones.id"), nullable=False
    )
    action_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # reply / match / post / activate / deactivate / etc
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    action_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
