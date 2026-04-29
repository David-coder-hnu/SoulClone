from __future__ import annotations
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, Integer, DECIMAL, Boolean, DateTime, JSON, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.clone import Clone


class CloneProfile(Base, TimestampMixin):
    __tablename__ = "clone_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )

    # Raw distillation inputs
    questionnaire_answers: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    chat_samples: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    social_import: Mapped[str | None] = mapped_column(Text, nullable=True)
    voice_sample_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Distilled outputs
    distilled_persona: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    chat_dna: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    emotional_triggers: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    decision_patterns: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    memory_seed: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Runtime config
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False, default="")
    voice_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    behavior_rules: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    autonomy_level: Mapped[int] = mapped_column(Integer, default=7)

    # Status
    completion_score: Mapped[float] = mapped_column(DECIMAL(5, 2), default=0.0)
    is_activated: Mapped[bool] = mapped_column(Boolean, default=False)
    distilled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="clone_profile")
    clone: Mapped["Clone"] = relationship("Clone", back_populates="profile")
