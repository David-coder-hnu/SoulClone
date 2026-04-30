from datetime import datetime, timezone

from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.takeover import Takeover
from app.models.user import User
from app.services.notification_service import NotificationService


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
        conversations = result.scalars().all()

        enriched = []
        for conv in conversations:
            partner_id = (
                str(conv.participant_b_id)
                if str(conv.participant_a_id) == user_id
                else str(conv.participant_a_id)
            )

            # Fetch partner info
            partner_result = await self.db.execute(
                select(User).where(User.id == partner_id)
            )
            partner = partner_result.scalar_one_or_none()

            # Fetch last message preview
            last_msg_result = await self.db.execute(
                select(Message)
                .where(Message.conversation_id == conv.id)
                .order_by(Message.created_at.desc())
                .limit(1)
            )
            last_msg = last_msg_result.scalar_one_or_none()

            # Count unread messages (sent by partner, not read)
            unread_result = await self.db.execute(
                select(func.count(Message.id)).where(
                    Message.conversation_id == conv.id,
                    Message.sender_id == partner_id,
                    Message.is_read == False,
                )
            )
            unread_count = unread_result.scalar() or 0

            enriched.append({
                "id": conv.id,
                "match_id": conv.match_id,
                "participant_a_id": conv.participant_a_id,
                "participant_b_id": conv.participant_b_id,
                "status": conv.status,
                "intimacy_score": conv.intimacy_score,
                "relationship_stage": conv.relationship_stage,
                "last_message_at": conv.last_message_at,
                "created_at": conv.created_at,
                "partner_nickname": partner.nickname if partner else None,
                "partner_avatar": partner.avatar_url if partner else None,
                "partner_is_online": partner.is_online if partner else False,
                "last_message_preview": last_msg.content[:60] if last_msg else None,
                "unread_count": unread_count,
            })

        return enriched

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

        # Notify recipient
        other_user_id = str(conv.participant_b_id) if str(conv.participant_a_id) == sender_id else str(conv.participant_a_id)
        notif_service = NotificationService(self.db)
        sender_label = "AI 孪生" if sender_type == "clone" else "对方"
        await notif_service.create_notification(
            user_id=other_user_id,
            type="message",
            title=f"新消息",
            content=f"{sender_label}: {content[:40]}{'...' if len(content) > 40 else ''}",
            payload={"conversation_id": str(conversation_id), "message_id": str(msg.id)},
        )

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

        # Notify the other participant that human has taken over
        conv = await self.get_conversation(conversation_id)
        if conv:
            other_user_id = str(conv.participant_b_id) if str(conv.participant_a_id) == user_id else str(conv.participant_a_id)
            notif_service = NotificationService(self.db)
            await notif_service.create_notification(
                user_id=other_user_id,
                type="takeover_request",
                title="真人接管",
                content="对方已切换为手动回复模式",
                payload={"conversation_id": str(conversation_id)},
            )

        return takeover

    async def end_takeover(self, takeover_id: str) -> Takeover:
        result = await self.db.execute(select(Takeover).where(Takeover.id == takeover_id))
        takeover = result.scalar_one_or_none()
        if takeover:
            takeover.ended_at = datetime.now(timezone.utc)
            await self.db.commit()
            await self.db.refresh(takeover)
        return takeover
