from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MatchOut(BaseModel):
    id: UUID
    user_a_id: UUID
    user_b_id: UUID
    compatibility_score: float
    match_reason: str | None = None
    status: str
    initiated_by: str
    created_at: datetime
    accepted_at: datetime | None = None

    class Config:
        from_attributes = True


class MatchAction(BaseModel):
    action: str  # accept, reject
