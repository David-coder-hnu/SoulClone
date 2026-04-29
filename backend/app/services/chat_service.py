from datetime import datetime, timezone

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.takeover import Takeover


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_conversations(self, user_id: str):
        result = await self.db.execute(
            select(Conversation).where(
                or_(
                    Conversation.participant_a_id == user_id,
                    Conversation.participant_b_id == user_id,
                )
            ).order_by(Conversation.last_message_at.desc())
        )
        return result.scalars().all()

    async def get_conversation(self, conversation_id: str):
        result = await self.db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        return result.scalar_one_or_none()

    async def create_conversation(self, participant_a_id: str, participant_b_id: str) -> Conversation:
        conv = Conversation(
            participant_a_id=participant_a_id,
            participant_b_id=participant_b_id,
        )
        self.db.add(conv)
        await self.db.commit()
        await self.db.refresh(conv)
        return conv

    async def list_messages(self, conversation_id: str):
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )
        return result.scalars().all()

    async def send_message(
        self,
        conversation_id: str,
        sender_id: str,
        sender_type: str,
        content: str,
        sender_clone_id: str | None = None,
    ) -> Message:
        msg = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            sender_type=sender_type,
            sender_clone_id=sender_clone_id,
            content=content,
        )
        self.db.add(msg)

        # Update conversation last_message_at
        conv = await self.get_conversation(conversation_id)
        if conv:
            conv.last_message_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(msg)
        return msg

    async def start_takeover(self, conversation_id: str, user_id: str, clone_id: str | None = None) -> Takeover:
        takeover = Takeover(
            conversation_id=conversation_id,
            user_id=user_id,
            clone_id=clone_id,
        )
        self.db.add(takeover)
        await self.db.commit()
        await self.db.refresh(takeover)
        return takeover

    async def end_takeover(self, takeover_id: str) -> Takeover:
        result = await self.db.execute(select(Takeover).where(Takeover.id == takeover_id))
        takeover = result.scalar_one_or_none()
        if takeover:
            takeover.ended_at = datetime.now(timezone.utc)
            await self.db.commit()
            await self.db.refresh(takeover)
        return takeover
