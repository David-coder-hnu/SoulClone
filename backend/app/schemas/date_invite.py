from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DateInviteCreate(BaseModel):
    conversation_id: UUID
    proposed_time: datetime
    proposed_location: str
    proposed_lat: float | None = None
    proposed_lng: float | None = None


class DateInviteOut(BaseModel):
    id: UUID
    conversation_id: UUID
    proposer_clone_id: UUID
    proposer_user_id: UUID
    invitee_user_id: UUID
    proposed_time: datetime | None = None
    proposed_location: str | None = None
    proposed_lat: float | None = None
    proposed_lng: float | None = None
    status: str
    ai_reasoning: str | None = None
    clone_confidence: float | None = None
    user_decision: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
