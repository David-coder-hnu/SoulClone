from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin

if TYPE_CHECKING:
    pass


class MemoryEmbedding(Base, UUIDMixin):
    """Vector embeddings for long-term memories (stored as JSONB float arrays)."""

    __tablename__ = "memory_embeddings"

    memory_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("long_term_memories.id"), nullable=False, unique=True
    )
    embedding: Mapped[list[float]] = mapped_column(JSON, nullable=False)
    model: Mapped[str] = mapped_column(String(50), nullable=False, default="text-embedding-3-small")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
