from app.websocket.manager import manager
from app.services.chat_service import ChatService
from app.services.conversation_access_service import ConversationAccessService


class TakeoverHandler:
    def __init__(self, db):
        self.db = db
        self.chat_service = ChatService(db)
        self.access = ConversationAccessService(db)

    async def handle_takeover(self, user_id: str, data: dict):
        action = data.get("action")
        conversation_id = data.get("conversation_id")

        conversation = await self.access.require_member(conversation_id, user_id)
        recipient_ids = self.access.participant_ids(conversation)

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
