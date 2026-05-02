from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    pass


class RelationshipState(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "relationship_states"

    clone_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("clones.id"), nullable=False
    )
    other_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    intimacy_score: Mapped[float] = mapped_column(Float, default=0.0)
    relationship_stage: Mapped[str] = mapped_column(
        String(20), default="stranger"
    )  # stranger / acquaintance / friend / close / intimate
    interaction_count: Mapped[int] = mapped_column(Integer, default=0)
    milestones: Mapped[list[dict] | None] = mapped_column(JSON, default=list)
    last_interaction_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
