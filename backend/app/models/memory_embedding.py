from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    pass


class MemoryEmbedding(Base, UUIDMixin, TimestampMixin):
    """Vector embeddings for long-term memories (stored as JSONB float arrays)."""

    __tablename__ = "memory_embeddings"

    memory_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("long_term_memories.id"), nullable=False, unique=True
    )
    embedding: Mapped[list[float]] = mapped_column(JSON, nullable=False)
    model: Mapped[str] = mapped_column(String(50), nullable=False, default="text-embedding-3-small")
