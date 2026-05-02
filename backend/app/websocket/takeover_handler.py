from app.websocket.manager import manager
from app.services.chat_service import ChatService


class TakeoverHandler:
    def __init__(self, db):
        self.db = db
        self.chat_service = ChatService(db)

    async def handle_takeover(self, user_id: str, data: dict):
        action = data.get("action")
        conversation_id = data.get("conversation_id")

        conv = await self.chat_service.get_conversation(conversation_id)
        recipient_ids = []
        if conv:
            recipient_ids = [str(conv.participant_a_id), str(conv.participant_b_id)]

        if action == "enter":
            takeover = await self.chat_service.start_takeover(
                conversation_id=conversation_id,
                user_id=user_id,
            )
            await manager.send_to_users({
                "type": "takeover_notice",
                "conversation_id": conversation_id,
                "taken_over_by": "human",
            }, recipient_ids)
            return {"status": "takeover_started", "takeover_id": str(takeover.id)}

        elif action == "exit":
            await manager.send_to_users({
                "type": "takeover_notice",
                "conversation_id": conversation_id,
                "taken_over_by": "avatar",
            }, recipient_ids)
            return {"status": "released"}

        return {"status": "unknown_action"}
