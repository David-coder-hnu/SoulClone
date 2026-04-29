from app.websocket.manager import manager
from app.services.chat_service import ChatService


class ChatHandler:
    def __init__(self, db):
        self.db = db
        self.chat_service = ChatService(db)

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

        msg = await self.chat_service.send_message(
            conversation_id=conversation_id,
            sender_id=user_id,
            sender_type="human",
            content=content,
        )

        # Notify other participant
        await manager.broadcast({
            "type": "message",
            "conversation_id": conversation_id,
            "message": {
                "id": str(msg.id),
                "sender_id": user_id,
                "content": content,
            },
        })

    async def _handle_typing(self, user_id: str, data: dict):
        await manager.broadcast({
            "type": "typing",
            "conversation_id": data.get("conversation_id"),
            "user_id": user_id,
            "is_typing": data.get("is_typing", False),
        })

    async def _handle_read_receipt(self, user_id: str, data: dict):
        pass
