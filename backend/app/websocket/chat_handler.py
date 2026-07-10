"""
ChatHandler — WebSocket 消息处理器

处理人类用户的消息，并在适当时机触发克隆体自动回复。
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from pydantic import ValidationError

from app.websocket.manager import manager
from app.websocket.clone_bridge import CloneBridge
from app.services.chat_service import ChatService
from app.services.conversation_access_service import (
    ConversationAccessError,
    ConversationAccessService,
)
from app.services.conversation_control_service import (
    ConversationControlService,
    ControlSnapshot,
    InvalidControlTransition,
)
from app.models.clone import Clone
from app.schemas.websocket import (
    ChatMessageEvent,
    ControlEvent,
    ReadReceiptEvent,
    PingEvent,
    TypingEvent,
    client_event_adapter,
)


class ChatHandler:
    def __init__(self, db):
        self.db = db
        self.chat_service = ChatService(db)
        self.access = ConversationAccessService(db)
        self.control = ConversationControlService(db)
        self.clone_bridge = CloneBridge(db)

    async def handle_message(self, user_id: str, data: dict):
        try:
            event = client_event_adapter.validate_python(data)
        except ValidationError:
            await self._send_error(user_id, "INVALID_EVENT", "Invalid event payload")
            return

        try:
            if isinstance(event, ChatMessageEvent):
                await self._handle_chat_message(user_id, event)
            elif isinstance(event, TypingEvent):
                await self._handle_typing(user_id, event)
            elif isinstance(event, ReadReceiptEvent):
                await self._handle_read_receipt(user_id, event)
            elif isinstance(event, ControlEvent):
                await self._handle_control(user_id, event)
            elif isinstance(event, PingEvent):
                await manager.send_personal_message(
                    {
                        "type": "pong",
                        "client_time": event.client_time,
                        "server_time": datetime.now(timezone.utc).isoformat(),
                    },
                    user_id,
                )
        except ConversationAccessError:
            await self._send_error(
                user_id,
                "CONVERSATION_NOT_FOUND",
                "Conversation not found",
            )

    async def _handle_chat_message(self, user_id: str, event: ChatMessageEvent):
        conversation_id = event.conversation_id
        content = event.content
        conversation = await self.access.require_member(conversation_id, user_id)

        # Save human message
        msg, created = await self.chat_service.send_message_idempotent(
            conversation_id=conversation_id,
            sender_id=user_id,
            sender_type="human",
            content=content,
            client_message_id=event.client_message_id,
        )

        await manager.send_personal_message(
            {
                "type": "ack",
                "client_message_id": str(event.client_message_id),
                "server_message_id": str(msg.id),
                "status": msg.delivery_status,
                "duplicate": not created,
            },
            user_id,
        )

        if not created:
            return

        # Send only to conversation participants (privacy-safe)
        recipient_ids = self.access.participant_ids(conversation)

        await manager.send_to_users({
            "type": "message",
            "conversation_id": conversation_id,
            "message": {
                "id": str(msg.id),
                "sender_id": user_id,
                "sender_type": "human",
                "client_message_id": str(event.client_message_id),
                "content": content,
                "created_at": msg.created_at.isoformat() if msg.created_at else None,
            },
        }, recipient_ids)

        msg.delivery_status = "delivered"
        await self.db.commit()

        # Trigger clone reply if the other participant has an active clone
        await self._trigger_clone_reply_if_needed(conversation_id, user_id, content)

    async def _trigger_clone_reply_if_needed(
        self, conversation_id: str, sender_user_id: str, incoming_content: str
    ):
        """Check if the recipient has an active clone, and trigger auto-reply"""
        # Get conversation to find the other participant
        conv = await self.chat_service.get_conversation(conversation_id)
        if not conv:
            return

        other_user_id = str(conv.participant_b_id) if str(conv.participant_a_id) == sender_user_id else str(conv.participant_a_id)

        # Check if other user has an active clone
        result = await self.db.execute(
            select(Clone).where(
                Clone.user_id == uuid.UUID(other_user_id),
                Clone.status == "active",
            )
        )
        clone = result.scalar_one_or_none()
        if not clone:
            return

        allowed, control = await self.control.clone_reply_allowed(
            conversation_id,
            other_user_id,
        )
        if not allowed:
            return

        # Trigger clone reply via clone_bridge
        try:
            await self.clone_bridge.generate_and_send_clone_reply(
                clone_id=str(clone.id),
                user_id=other_user_id,
                conversation_id=conversation_id,
                incoming_message=incoming_content,
                other_user_id=sender_user_id,
                control_version_at_start=control.version,
            )
        except Exception as e:
            # Log error but don't crash the websocket
            print(f"Clone reply failed: {e}")

    async def _handle_typing(self, user_id: str, event: TypingEvent):
        conversation_id = event.conversation_id
        conversation = await self.access.require_member(conversation_id, user_id)
        recipient_ids = self.access.participant_ids(conversation)

        await manager.send_to_users({
            "type": "typing",
            "conversation_id": conversation_id,
            "user_id": user_id,
            "is_typing": event.is_typing,
        }, recipient_ids)

    async def _handle_read_receipt(self, user_id: str, event: ReadReceiptEvent):
        conversation_id = event.conversation_id
        conversation = await self.access.require_member(conversation_id, user_id)
        try:
            message_ids, read_at = await self.chat_service.mark_read_through(
                conversation_id=conversation_id,
                reader_id=user_id,
                message_id=event.message_id,
            )
        except ValueError:
            await self._send_error(user_id, "MESSAGE_NOT_FOUND", "Message not found")
            return

        await manager.send_to_users(
            {
                "type": "read_receipt",
                "conversation_id": str(conversation_id),
                "read_by": user_id,
                "read_through_message_id": str(event.message_id),
                "message_ids": [str(message_id) for message_id in message_ids],
                "read_at": read_at.isoformat(),
            },
            self.access.participant_ids(conversation),
        )

    async def _handle_control(self, user_id: str, event: ControlEvent):
        conversation = await self.access.require_member(event.conversation_id, user_id)
        if event.action == "get":
            snapshot = await self.control.snapshot(event.conversation_id, user_id)
            await manager.send_personal_message(
                self._control_payload(snapshot), user_id
            )
            return

        try:
            snapshot = await self.control.transition(
                event.conversation_id,
                user_id,
                event.action,
                actor="human",
                reason=f"websocket_{event.action}",
            )
        except InvalidControlTransition as exc:
            await self._send_error(user_id, "INVALID_CONTROL_TRANSITION", str(exc))
            return

        await manager.send_to_users(
            self._control_payload(snapshot),
            self.access.participant_ids(conversation),
        )

    @staticmethod
    def _control_payload(snapshot: ControlSnapshot) -> dict:
        return {
            "type": "control_changed",
            "conversation_id": str(snapshot.conversation_id),
            "user_id": str(snapshot.user_id),
            "mode": snapshot.mode,
            "version": snapshot.version,
            "changed_at": snapshot.changed_at.isoformat(),
            "expires_at": (
                snapshot.expires_at.isoformat() if snapshot.expires_at else None
            ),
            "changed_by": snapshot.changed_by,
            "reason": snapshot.reason,
        }

    @staticmethod
    async def _send_error(user_id: str, code: str, message: str) -> None:
        await manager.send_personal_message(
            {
                "type": "error",
                "code": code,
                "message": message,
            },
            user_id,
        )
