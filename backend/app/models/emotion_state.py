from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin

if TYPE_CHECKING:
    pass


class EmotionState(Base, UUIDMixin):
    __tablename__ = "emotion_states"

    clone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clones.id"), nullable=False, unique=True
    )
    current_mood: Mapped[str | None] = mapped_column(String(20), nullable=True)
    intensity: Mapped[float] = mapped_column(Float, default=0.5)
    last_update_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    mood_history: Mapped[list[dict] | None] = mapped_column(JSON, default=list)
