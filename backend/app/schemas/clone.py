from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CloneOut(BaseModel):
    id: UUID
    user_id: UUID
    profile_id: UUID | None = None
    name: str | None = None
    status: str
    total_conversations: int
    total_messages_sent: int
    total_matches: int
    total_posts: int
    total_comments: int
    avg_response_time_sec: int | None = None
    success_rate: float | None = None
    current_mood: str | None = None
    active_relationships: dict | None = None
    memory_summaries: dict | None = None
    last_activity_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class CloneConfigUpdate(BaseModel):
    name: str | None = None
    autonomy_level: int | None = None
    status: str | None = None
