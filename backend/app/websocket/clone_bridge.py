"""
CloneBridge — Persistent clone message bridge.

Integrates emotion simulation, memory management, and response generation
with full PostgreSQL + Redis persistence.
"""

import asyncio
from datetime import datetime, timezone
from sqlalchemy import select

from app.websocket.manager import manager
from app.services.chat_service import ChatService
from app.ai.clone_engine.response_generator import ResponseGenerator
from app.ai.clone_engine.emotion_simulator import EmotionSimulator
from app.ai.clone_engine.memory_manager import MemoryManager
from app.models.clone_profile import CloneProfile
from app.models.clone import Clone


class CloneBridge:
    """Bridge for clone-generated messages with persistent persona context."""

    def __init__(self, db):
        self.db = db
        self.chat_service = ChatService(db)
        self.generator = ResponseGenerator()
        self.emotion = EmotionSimulator(db=db)
        self.memory = MemoryManager(db=db)
        self._initialized: set[str] = set()

    async def initialize_clone(self, clone_id: str):
        """Load clone persona into emotion simulator and memory manager (idempotent)."""
        if clone_id in self._initialized:
            return True

        result = await self.db.execute(
            select(Clone).where(Clone.id == clone_id)
        )
        clone = result.scalar_one_or_none()
        if not clone or not clone.profile_id:
            return False

        result = await self.db.execute(
            select(CloneProfile).where(CloneProfile.id == clone.profile_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return False

        # Load emotional profile
        emotional_profile = {
            **(profile.distilled_persona or {}),
            "emotional_vulnerabilities": profile.emotional_triggers or [],
            "attachment_style": (profile.decision_patterns or {}).get("attachment_style", "secure"),
            "vocabulary_profile": (profile.chat_dna or {}).get("vocabulary_profile", {}),
        }
        self.emotion.load_persona(str(clone_id), emotional_profile)

        # Load memory seed
        if profile.memory_seed:
            self.memory.load_memory_seed(str(clone_id), profile.memory_seed)

        self._initialized.add(clone_id)
        return True

    async def generate_and_send_clone_reply(
        self,
        clone_id: str,
        user_id: str,
        conversation_id: str,
        incoming_message: str,
        other_user_id: str,
    ):
        """
        Full clone reply pipeline:
        1. Update emotional state from incoming message
        2. Record interaction in memory
        3. Load clone profile
        4. Build conversation history
        5. Generate response with full context
        6. Apply behavior rules (delay, length)
        7. Send via WebSocket
        """
        # Ensure clone is initialized
        await self.initialize_clone(clone_id)

        # 1. Update emotional state
        await self.emotion.update_from_message(clone_id, incoming_message)
        mood_context = await self.emotion.get_mood_context(clone_id)

        # 2. Record interaction
        await self.memory.add_interaction(
            clone_id, conversation_id, "user", incoming_message, other_user_id
        )

        # 3. Load clone profile
        result = await self.db.execute(
            select(Clone).where(Clone.id == clone_id)
        )
        clone = result.scalar_one_or_none()
        if not clone or not clone.profile_id:
            return None

        result = await self.db.execute(
            select(CloneProfile).where(CloneProfile.id == clone.profile_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return None

        # 4. Build conversation history
        history = await self.memory.get_conversation_history(clone_id, conversation_id, limit=10)
        formatted_history = [
            {"role": "assistant" if h["role"] == "clone" else "user", "content": h["content"]}
            for h in history
        ]

        # 5. Build memory context
        memory_context = await self.memory.get_memory_context(
            clone_id, conversation_id, other_user_id
        )

        # 6. Build relationship context (read from DB, not hardcoded)
        relationship_context = await self._build_relationship_context(
            clone_id, other_user_id, history
        )

        # 7. Generate response
        response_text = await self.generator.generate(
            system_prompt=profile.system_prompt,
            conversation_history=formatted_history,
            user_message=incoming_message,
            relationship_context=relationship_context,
            current_mood=mood_context,
            memory_context=memory_context,
            behavior_rules=profile.behavior_rules or {},
        )

        # 8. Apply reply delay based on behavior rules and mood
        behavior_rules = profile.behavior_rules or {}
        delay_min = behavior_rules.get("reply_delay_min_sec", 30)
        delay_max = behavior_rules.get("reply_delay_max_sec", 300)

        intensity = mood_context.get("intensity", 0.5)
        if intensity > 0.7:
            delay_max = min(delay_max, 120)
        elif intensity < 0.3:
            delay_min = max(delay_min, 60)

        # Use random delay within range (not fixed 0.3)
        import random
        delay = random.randint(delay_min, delay_max)
        await asyncio.sleep(delay)

        # 9. Store and send message
        msg = await self.chat_service.send_message(
            conversation_id=conversation_id,
            sender_id=user_id,
            sender_type="clone",
            sender_clone_id=clone_id,
            content=response_text,
        )

        # 10. Record clone's own response in memory
        await self.memory.add_interaction(
            clone_id, conversation_id, "clone", response_text, other_user_id
        )

        # 11. Broadcast
        await manager.broadcast({
            "type": "message",
            "conversation_id": conversation_id,
            "message": {
                "id": str(msg.id),
                "sender_id": user_id,
                "content": response_text,
                "created_at": msg.created_at.isoformat() if msg.created_at else None,
            },
        })

        # Update relationship intimacy (simple heuristic)
        if other_user_id:
            await self._update_intimacy(clone_id, other_user_id, incoming_message, response_text)

        # Update clone stats
        clone.total_messages_sent = (clone.total_messages_sent or 0) + 1
        clone.last_activity_at = datetime.now(timezone.utc)
        await self.db.commit()

        return msg

    async def generate_clone_post(
        self,
        clone_id: str,
        user_id: str,
        recent_activities: list[str],
    ) -> str:
        """Generate a social post in clone's style."""
        await self.initialize_clone(clone_id)

        result = await self.db.execute(
            select(Clone).where(Clone.id == clone_id)
        )
        clone = result.scalar_one_or_none()
        if not clone or not clone.profile_id:
            return ""

        result = await self.db.execute(
            select(CloneProfile).where(CloneProfile.id == clone.profile_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return ""

        mood_context = await self.emotion.get_mood_context(clone_id)
        memory_context = await self.memory.get_memory_context(clone_id, "feed")

        post = await self.generator.generate_post(
            system_prompt=profile.system_prompt,
            recent_activities=recent_activities,
            mood=mood_context,
            memory_context=memory_context,
        )

        return post

    async def _update_intimacy(
        self, clone_id: str, other_user_id: str, incoming: str, outgoing: str
    ):
        """Update relationship intimacy based on message exchange."""
        from app.models.relationship_state import RelationshipState
        import uuid

        result = await self.db.execute(
            select(RelationshipState)
            .where(RelationshipState.clone_id == uuid.UUID(clone_id))
            .where(RelationshipState.other_user_id == uuid.UUID(other_user_id))
        )
        rel = result.scalar_one_or_none()
        if not rel:
            rel = RelationshipState(
                clone_id=uuid.UUID(clone_id),
                other_user_id=uuid.UUID(other_user_id),
            )
            self.db.add(rel)

        rel.interaction_count += 1
        rel.last_interaction_at = datetime.now(timezone.utc)

        # Simple intimacy scoring: base + message length bonus + vulnerability bonus
        base_increase = 1.0
        msg_len_bonus = min(5.0, (len(incoming) + len(outgoing)) / 100)

        # Vulnerability detection (self-disclosure signals)
        vuln_signals = ["我觉得", "我希望", "我害怕", "我不喜欢", "我小时候", "我家人", "我前任"]
        vuln_count = sum(1 for s in vuln_signals if s in incoming or s in outgoing)
        vuln_bonus = vuln_count * 2.0

        rel.intimacy_score = min(100.0, rel.intimacy_score + base_increase + msg_len_bonus + vuln_bonus)

        # Update stage
        stages = ["stranger", "acquaintance", "friend", "close", "intimate"]
        thresholds = [0, 10, 30, 60, 85]
        for stage, threshold in reversed(list(zip(stages, thresholds))):
            if rel.intimacy_score >= threshold:
                rel.relationship_stage = stage
                break

        await self.db.commit()

    async def _build_relationship_context(
        self, clone_id: str, other_user_id: str, history: list[dict]
    ) -> dict:
        """Build relationship context from persistent state."""
        from app.models.relationship_state import RelationshipState
        import uuid

        result = await self.db.execute(
            select(RelationshipState)
            .where(RelationshipState.clone_id == uuid.UUID(clone_id))
            .where(RelationshipState.other_user_id == uuid.UUID(other_user_id))
        )
        rel = result.scalar_one_or_none()

        if rel:
            return {
                "intimacy_level": rel.intimacy_score,
                "relationship_stage": rel.relationship_stage,
                "interaction_count": rel.interaction_count,
                "last_topic": self.memory._extract_topics(history[-3:]) if history else [],
            }

        return {
            "intimacy_level": 0,
            "relationship_stage": "stranger",
            "interaction_count": 0,
            "last_topic": [],
        }
