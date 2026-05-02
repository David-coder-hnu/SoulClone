from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Integer, Float, Text, ForeignKey, JSON
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    pass


class CalibrationRefinement(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "calibration_refinements"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    profile_version: Mapped[int] = mapped_column(Integer, nullable=False)
    previous_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    refined_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    changes_made: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
