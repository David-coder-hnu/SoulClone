from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    phone: str = Field(..., min_length=11, max_length=11)
    password: str = Field(..., min_length=6)
    nickname: str | None = None


class UserLogin(BaseModel):
    phone: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: UUID
    phone: str
    email: str | None = None
    nickname: str | None = None
    avatar_url: str | None = None
    gender: str | None = None
    birth_date: datetime | None = None
    location_city: str | None = None
    location_lat: float | None = None
    location_lng: float | None = None
    bio: str | None = None
    status: str
    is_online: bool
    last_active_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True
