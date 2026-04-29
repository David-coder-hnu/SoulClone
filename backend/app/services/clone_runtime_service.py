import random
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clone import Clone
from app.models.message import Message
from app.ai.clone_engine.action_planner import ActionPlanner
from app.ai.clone_engine.response_generator import ResponseGenerator


class CloneRuntimeService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.planner = ActionPlanner()
        self.generator = ResponseGenerator()

    async def evaluate_cycle(self):
        """Evaluate all active clones and execute their actions"""
        result = await self.db.execute(select(Clone).where(Clone.status == "active"))
        clones = result.scalars().all()

        for clone in clones:
            await self._process_clone(clone)

    async def _process_clone(self, clone: Clone):
        # Build state from database
        state = {
            "pending_messages": [],
            "initiative_score": clone.autonomy_level / 10.0,
            "social_drive": 0.3,
            "active_relationships": clone.active_relationships or [],
        }

        # Get pending messages
        result = await self.db.execute(
            select(Message)
            .where(
                Message.conversation_id.in_(
                    [r.get("conversation_id") for r in (clone.active_relationships or [])]
                ),
                Message.is_read == False,
            )
        )
        state["pending_messages"] = [
            {"id": str(m.id), "conversation_id": str(m.conversation_id), "is_read": m.is_read}
            for m in result.scalars().all()
        ]

        # Plan actions
        actions = await self.planner.plan_actions(state)

        for action in actions:
            if action["type"] == "reply":
                # Generate response
                pass

        # Update last activity
        clone.last_activity_at = datetime.now(timezone.utc)
        await self.db.commit()
