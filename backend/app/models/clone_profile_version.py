from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Integer, Text, ForeignKey, JSON
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    pass


class CloneProfileVersion(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "clone_profile_versions"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("clone_profiles.id"), nullable=False
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    system_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    behavior_rules: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    distilled_persona: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    chat_dna: Mapped[dict | None] = mapped_column(JSON, nullable=True)
