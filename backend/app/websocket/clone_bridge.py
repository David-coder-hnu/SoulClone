from app.websocket.manager import manager
from app.services.chat_service import ChatService
from app.ai.clone_engine.response_generator import ResponseGenerator


class CloneBridge:
    """Bridge for clone-generated messages to enter WebSocket"""

    def __init__(self, db):
        self.db = db
        self.chat_service = ChatService(db)
        self.generator = ResponseGenerator()

    async def send_clone_message(
        self,
        clone_id: str,
        user_id: str,
        conversation_id: str,
        content: str,
    ):
        msg = await self.chat_service.send_message(
            conversation_id=conversation_id,
            sender_id=user_id,
            sender_type="clone",
            sender_clone_id=clone_id,
            content=content,
        )

        await manager.broadcast({
            "type": "message",
            "conversation_id": conversation_id,
            "message": {
                "id": str(msg.id),
                "sender_id": user_id,
                "sender_type": "clone",
                "content": content,
            },
        })
