from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DistillationInput(BaseModel):
    questionnaire_answers: dict
    chat_samples: list[str] | None = None
    social_import: str | None = None
    voice_sample_url: str | None = None


class CloneProfileOut(BaseModel):
    id: UUID
    user_id: UUID
    completion_score: float
    is_activated: bool
    distilled_persona: dict
    chat_dna: dict
    emotional_triggers: dict | None = None
    decision_patterns: dict | None = None
    memory_seed: str | None = None
    system_prompt: str
    autonomy_level: int
    distilled_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True
