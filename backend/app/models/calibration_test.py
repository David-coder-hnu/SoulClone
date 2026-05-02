from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Text, ForeignKey, JSON
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    pass


class CalibrationTest(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "calibration_tests"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    profile_version: Mapped[int] = mapped_column(nullable=False)
    scenario: Mapped[str] = mapped_column(Text, nullable=False)
    generated_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    analysis: Mapped[dict | None] = mapped_column(JSON, nullable=True)
