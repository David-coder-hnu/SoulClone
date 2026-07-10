from app.websocket.manager import manager
from app.services.conversation_access_service import ConversationAccessService
from app.services.conversation_control_service import ConversationControlService


class TakeoverHandler:
    def __init__(self, db):
        self.db = db
        self.access = ConversationAccessService(db)
        self.control = ConversationControlService(db)

    async def handle_takeover(self, user_id: str, data: dict):
        action = data.get("action")
        conversation_id = data.get("conversation_id")

        conversation = await self.access.require_member(conversation_id, user_id)
        recipient_ids = self.access.participant_ids(conversation)

        if action == "enter":
            snapshot = await self.control.transition(
                conversation_id,
                user_id,
                "takeover",
                reason="legacy_websocket_takeover",
            )
            await manager.send_to_users(
                {
                    "type": "control_changed",
                    "conversation_id": conversation_id,
                    "user_id": user_id,
                    "mode": snapshot.mode,
                    "version": snapshot.version,
                },
                recipient_ids,
            )
            return {"status": "takeover_started", "version": snapshot.version}

        elif action == "exit":
            snapshot = await self.control.transition(
                conversation_id,
                user_id,
                "release",
                reason="legacy_websocket_release",
            )
            await manager.send_to_users(
                {
                    "type": "control_changed",
                    "conversation_id": conversation_id,
                    "user_id": user_id,
                    "mode": snapshot.mode,
                    "version": snapshot.version,
                },
                recipient_ids,
            )
            return {"status": "released", "version": snapshot.version}

        return {"status": "unknown_action"}
