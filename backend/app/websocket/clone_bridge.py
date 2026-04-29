"""
CloneBridge — 克隆体消息桥接器

当克隆体需要回复消息时，整合情绪模拟、记忆管理和回复生成，
输出精确到仿佛用户本人在打字的消息。
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
from app.models.conversation import Conversation


class CloneBridge:
    """Bridge for clone-generated messages to enter WebSocket with full persona context"""

    def __init__(self, db):
        self.db = db
        self.chat_service = ChatService(db)
        self.generator = ResponseGenerator()
        self.emotion = EmotionSimulator()
        self.memory = MemoryManager()

    async def initialize_clone(self, clone_id: str):
        """Load clone persona into emotion simulator and memory manager"""
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
        3. Load clone profile (system prompt + behavior rules)
        4. Build conversation history
        5. Generate response with full context
        6. Apply behavior rules (delay, length)
        7. Send via WebSocket
        """
        # Ensure clone is initialized
        await self.initialize_clone(clone_id)

        # 1. Update emotional state
        self.emotion.update_from_message(clone_id, incoming_message)
        mood_context = self.emotion.get_mood_context(clone_id)

        # 2. Record interaction
        self.memory.add_interaction(clone_id, conversation_id, "user", incoming_message, other_user_id)

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
        history = self.memory.get_conversation_history(clone_id, conversation_id, limit=10)
        formatted_history = [
            {"role": "assistant" if h["role"] == "clone" else "user", "content": h["content"]}
            for h in history
        ]

        # 5. Build memory context
        memory_context = self.memory.get_memory_context(clone_id, conversation_id, other_user_id)

        # 6. Build relationship context
        conv = await self.chat_service.get_conversation(conversation_id)
        relationship_context = {
            "intimacy_level": 50,  # TODO: calculate from interaction history
            "is_mutual_like": False,
            "last_topic": self.memory._extract_topics(history[-3:]) if history else [],
        }

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
        
        # Adjust delay based on mood intensity
        intensity = mood_context.get("intensity", 0.5)
        if intensity > 0.7:  # High emotion = faster reply
            delay_max = min(delay_max, 120)
        elif intensity < 0.3:  # Low emotion = slower reply
            delay_min = max(delay_min, 60)
        
        delay = min(delay_max, max(delay_min, delay_min + (delay_max - delay_min) * 0.3))
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
        self.memory.add_interaction(clone_id, conversation_id, "clone", response_text, other_user_id)

        # 11. Broadcast (without exposing clone identity)
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
        """Generate a social post in clone's style"""
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

        mood_context = self.emotion.get_mood_context(clone_id)
        memory_context = self.memory.get_memory_context(clone_id, "feed")

        post = await self.generator.generate_post(
            system_prompt=profile.system_prompt,
            recent_activities=recent_activities,
            mood=mood_context,
            memory_context=memory_context,
        )

        return post
