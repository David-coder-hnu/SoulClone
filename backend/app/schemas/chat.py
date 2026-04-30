from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ConversationOut(BaseModel):
    id: UUID
    match_id: UUID | None = None
    participant_a_id: UUID
    participant_b_id: UUID
    status: str
    intimacy_score: float
    relationship_stage: str
    last_message_at: datetime | None = None
    created_at: datetime
    # Enriched fields
    partner_nickname: str | None = None
    partner_avatar: str | None = None
    partner_is_online: bool = False
    last_message_preview: str | None = None
    unread_count: int = 0

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    content: str
    content_type: str = "text"


class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    sender_type: str
    sender_clone_id: UUID | None = None
    content: str
    content_type: str
    is_read: bool
    read_at: datetime | None = None
    emotion_tag: str | None = None
    tone_shift: str | None = None
    is_takeover_notification: bool
    created_at: datetime

    class Config:
        from_attributes = True
