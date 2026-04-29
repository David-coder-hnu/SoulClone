from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Boolean, DateTime, Text, DECIMAL, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.clone_profile import CloneProfile
    from app.models.clone import Clone


class User(Base, TimestampMixin):
    __tablename__ = "users"

    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    nickname: Mapped[str | None] = mapped_column(String(50), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(10), nullable=True)
    birth_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    location_city: Mapped[str | None] = mapped_column(String(50), nullable=True)
    location_lat: Mapped[float | None] = mapped_column(DECIMAL(10, 8), nullable=True)
    location_lng: Mapped[float | None] = mapped_column(DECIMAL(11, 8), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(
        Enum("distilling", "active", "suspended", name="user_status"),
        default="distilling",
    )
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)
    last_active_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    clone_profile: Mapped["CloneProfile"] = relationship(
        "CloneProfile", back_populates="user", uselist=False
    )
    clone: Mapped["Clone"] = relationship("Clone", back_populates="user", uselist=False)
