"""
ChatHandler — WebSocket 消息处理器

处理人类用户的消息，并在适当时机触发克隆体自动回复。
"""

from sqlalchemy import select

from app.websocket.manager import manager
from app.websocket.clone_bridge import CloneBridge
from app.services.chat_service import ChatService
from app.models.clone import Clone


class ChatHandler:
    def __init__(self, db):
        self.db = db
        self.chat_service = ChatService(db)
        self.clone_bridge = CloneBridge(db)

    async def handle_message(self, user_id: str, data: dict):
        msg_type = data.get("type")

        if msg_type == "message":
            await self._handle_chat_message(user_id, data)
        elif msg_type == "typing":
            await self._handle_typing(user_id, data)
        elif msg_type == "read_receipt":
            await self._handle_read_receipt(user_id, data)

    async def _handle_chat_message(self, user_id: str, data: dict):
        conversation_id = data.get("conversation_id")
        content = data.get("content")

        # Save human message
        msg = await self.chat_service.send_message(
            conversation_id=conversation_id,
            sender_id=user_id,
            sender_type="human",
            content=content,
        )

        # Send only to conversation participants (privacy-safe)
        conv = await self.chat_service.get_conversation(conversation_id)
        recipient_ids = []
        if conv:
            recipient_ids = [str(conv.participant_a_id), str(conv.participant_b_id)]

        await manager.send_to_users({
            "type": "message",
            "conversation_id": conversation_id,
            "message": {
                "id": str(msg.id),
                "sender_id": user_id,
                "content": content,
                "created_at": msg.created_at.isoformat() if msg.created_at else None,
            },
        }, recipient_ids)

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
                Clone.user_id == other_user_id,
                Clone.status == "active",
            )
        )
        clone = result.scalar_one_or_none()
        if not clone:
            return

        # Check if there's an active takeover (human is controlling)
        # TODO: check takeover state
        
        # Trigger clone reply via clone_bridge
        try:
            await self.clone_bridge.generate_and_send_clone_reply(
                clone_id=str(clone.id),
                user_id=other_user_id,
                conversation_id=conversation_id,
                incoming_message=incoming_content,
                other_user_id=sender_user_id,
            )
        except Exception as e:
            # Log error but don't crash the websocket
            print(f"Clone reply failed: {e}")

    async def _handle_typing(self, user_id: str, data: dict):
        conversation_id = data.get("conversation_id")
        conv = await self.chat_service.get_conversation(conversation_id)
        recipient_ids = []
        if conv:
            recipient_ids = [str(conv.participant_a_id), str(conv.participant_b_id)]

        await manager.send_to_users({
            "type": "typing",
            "conversation_id": conversation_id,
            "user_id": user_id,
            "is_typing": data.get("is_typing", False),
        }, recipient_ids)

    async def _handle_read_receipt(self, user_id: str, data: dict):
        pass
