from __future__ import annotations

import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation


class ConversationAccessError(Exception):
    """Raised when a conversation is absent or inaccessible to the caller."""


class ConversationAccessService:
    """Single authorization boundary for conversation-scoped operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def require_member(
        self,
        conversation_id: str | uuid.UUID,
        user_id: str | uuid.UUID,
    ) -> Conversation:
        try:
            conversation_uuid = uuid.UUID(str(conversation_id))
            user_uuid = uuid.UUID(str(user_id))
        except (TypeError, ValueError):
            raise ConversationAccessError from None

        result = await self.db.execute(
            select(Conversation).where(
                Conversation.id == conversation_uuid,
                or_(
                    Conversation.participant_a_id == user_uuid,
                    Conversation.participant_b_id == user_uuid,
                ),
            )
        )
        conversation = result.scalar_one_or_none()
        if conversation is None:
            # Deliberately do not reveal whether the conversation exists.
            raise ConversationAccessError
        return conversation

    @staticmethod
    def participant_ids(conversation: Conversation) -> list[str]:
        return [
            str(conversation.participant_a_id),
            str(conversation.participant_b_id),
        ]
