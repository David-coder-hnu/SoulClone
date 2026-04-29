import random
from datetime import datetime, timezone


class ActionPlanner:
    """Decides what actions a clone should take"""

    async def plan_actions(self, clone_state: dict) -> list[dict]:
        """Returns a list of actions for the clone to execute"""
        actions = []

        # Check pending messages first (highest priority)
        pending_messages = clone_state.get("pending_messages", [])
        for msg in pending_messages:
            if self._should_reply(clone_state, msg):
                actions.append({
                    "type": "reply",
                    "conversation_id": msg["conversation_id"],
                    "message_id": msg["id"],
                    "delay_seconds": random.randint(30, 300),
                })

        # Proactive actions
        if random.random() < clone_state.get("initiative_score", 0.3):
            proactive = await self._decide_proactive_action(clone_state)
            if proactive:
                actions.append(proactive)

        # Community engagement
        if random.random() < clone_state.get("social_drive", 0.2):
            actions.append({
                "type": "browse_feed",
                "actions": ["like", "comment"],
            })

        return actions

    def _should_reply(self, clone_state: dict, message: dict) -> bool:
        # Simple logic: always reply to unread messages
        return not message.get("is_read", False)

    async def _decide_proactive_action(self, clone_state: dict) -> dict | None:
        active_relationships = clone_state.get("active_relationships", [])

        # If we have active conversations, maybe send a thoughtful message
        if active_relationships and random.random() < 0.5:
            rel = random.choice(active_relationships)
            return {
                "type": "send_message",
                "conversation_id": rel["conversation_id"],
                "context": "proactive_check_in",
            }

        # Otherwise, try to find new matches
        return {
            "type": "request_match",
            "criteria": clone_state.get("target_criteria", {}),
        }
