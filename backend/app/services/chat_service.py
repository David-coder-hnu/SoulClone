from datetime import datetime, timezone
import uuid

from sqlalchemy import select, or_, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.message import Message
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
                    Message.is_read.is_(False),
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
            select(Conversation).where(
                Conversation.id == self._as_uuid(conversation_id)
            )
        )
        return result.scalar_one_or_none()

    async def create_conversation(self, participant_a_id: str, participant_b_id: str) -> Conversation:
        conv = Conversation(
            participant_a_id=self._as_uuid(participant_a_id),
            participant_b_id=self._as_uuid(participant_b_id),
        )
        self.db.add(conv)
        await self.db.commit()
        await self.db.refresh(conv)
        return conv

    async def list_messages(self, conversation_id: str):
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == self._as_uuid(conversation_id))
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
        client_message_id: str | uuid.UUID | None = None,
    ) -> Message:
        message, _ = await self.send_message_idempotent(
            conversation_id=conversation_id,
            sender_id=sender_id,
            sender_type=sender_type,
            content=content,
            sender_clone_id=sender_clone_id,
            client_message_id=client_message_id,
        )
        return message

    async def send_message_idempotent(
        self,
        conversation_id: str | uuid.UUID,
        sender_id: str | uuid.UUID,
        sender_type: str,
        content: str,
        sender_clone_id: str | uuid.UUID | None = None,
        client_message_id: str | uuid.UUID | None = None,
    ) -> tuple[Message, bool]:
        sender_uuid = self._as_uuid(sender_id)
        client_uuid = self._as_uuid(client_message_id) if client_message_id else None

        if client_uuid:
            existing = await self._get_by_client_message_id(sender_uuid, client_uuid)
            if existing:
                return existing, False

        msg = Message(
            conversation_id=self._as_uuid(conversation_id),
            sender_id=sender_uuid,
            sender_type=sender_type,
            sender_clone_id=(
                self._as_uuid(sender_clone_id) if sender_clone_id else None
            ),
            client_message_id=client_uuid,
            content=content,
            delivery_status="persisted",
        )
        self.db.add(msg)

        # Update conversation last_message_at
        conv = await self.get_conversation(conversation_id)
        if conv:
            conv.last_message_at = datetime.now(timezone.utc)

        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            if client_uuid:
                existing = await self._get_by_client_message_id(
                    sender_uuid,
                    client_uuid,
                )
                if existing:
                    return existing, False
            raise
        await self.db.refresh(msg)

        # Notify recipient
        other_user_id = (
            conv.participant_b_id
            if conv.participant_a_id == sender_uuid
            else conv.participant_a_id
        )
        notif_service = NotificationService(self.db)
        sender_label = "AI 孪生" if sender_type == "clone" else "对方"
        await notif_service.create_notification(
            user_id=other_user_id,
            type="message",
            title="新消息",
            content=f"{sender_label}: {content[:40]}{'...' if len(content) > 40 else ''}",
            payload={"conversation_id": str(conversation_id), "message_id": str(msg.id)},
        )

        return msg, True

    async def _get_by_client_message_id(
        self,
        sender_id: uuid.UUID,
        client_message_id: uuid.UUID,
    ) -> Message | None:
        result = await self.db.execute(
            select(Message).where(
                Message.sender_id == sender_id,
                Message.client_message_id == client_message_id,
            )
        )
        return result.scalar_one_or_none()

    async def mark_read_through(
        self,
        conversation_id: str | uuid.UUID,
        reader_id: str | uuid.UUID,
        message_id: str | uuid.UUID,
    ) -> tuple[list[uuid.UUID], datetime]:
        conversation_uuid = self._as_uuid(conversation_id)
        reader_uuid = self._as_uuid(reader_id)
        message_uuid = self._as_uuid(message_id)

        cursor_result = await self.db.execute(
            select(Message).where(
                Message.id == message_uuid,
                Message.conversation_id == conversation_uuid,
            )
        )
        cursor = cursor_result.scalar_one_or_none()
        if cursor is None:
            raise ValueError("Message cursor not found")

        unread_result = await self.db.execute(
            select(Message).where(
                Message.conversation_id == conversation_uuid,
                Message.sender_id != reader_uuid,
                Message.created_at <= cursor.created_at,
                Message.is_read.is_(False),
            )
        )
        unread_messages = unread_result.scalars().all()
        read_at = datetime.now(timezone.utc)
        for message in unread_messages:
            message.is_read = True
            message.read_at = read_at
            message.delivery_status = "read"

        if unread_messages:
            await self.db.commit()

        return [message.id for message in unread_messages], read_at

    @staticmethod
    def _as_uuid(value: str | uuid.UUID) -> uuid.UUID:
        return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
