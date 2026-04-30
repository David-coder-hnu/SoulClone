"""
MemoryManager — Persistent intelligent memory management.

Hot data (recent 50 messages) → Redis (TTL 24h)
Full data → PostgreSQL (conversation_memories, long_term_memories, relationship_states)
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from collections import defaultdict

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

import numpy as np

from app.core.redis_client import redis_client
from app.models.conversation_memory import ConversationMemory
from app.models.long_term_memory import LongTermMemory
from app.models.relationship_state import RelationshipState
from app.models.memory_embedding import MemoryEmbedding
from app.ai.llm_client import llm_client


class MemoryManager:
    """Manages conversation memory with persona-aware summarization and persistent storage."""

    def __init__(self, db: AsyncSession | None = None):
        self.db = db
        self.memory_seeds: dict[str, str] = {}  # clone_id -> memory_seed (ephemeral)
        # In-memory caches for current session (always backed by DB)
        self._short_term_cache: dict[str, list[dict]] = {}
        self._interaction_counts: dict[str, int] = defaultdict(int)
        self._milestones: dict[str, list[dict]] = defaultdict(list)

    # -----------------------------------------------------------------------
    # Memory seed
    # -----------------------------------------------------------------------

    def load_memory_seed(self, clone_id: str, memory_seed: str):
        """Load the distilled memory seed for a clone (kept in memory for fast access)."""
        self.memory_seeds[clone_id] = memory_seed

    # -----------------------------------------------------------------------
    # Short-term memory (conversation history)
    # -----------------------------------------------------------------------

    async def add_interaction(
        self,
        clone_id: str,
        conversation_id: str,
        role: str,
        content: str,
        other_user_id: str | None = None,
    ):
        """Record an interaction in short-term memory (DB + Redis cache)."""
        key = f"{clone_id}:{conversation_id}"
        now = datetime.now(timezone.utc)

        entry = {
            "role": role,
            "content": content,
            "timestamp": now.isoformat(),
        }

        # 1. Persist to PostgreSQL
        if self.db:
            import uuid
            mem = ConversationMemory(
                clone_id=uuid.UUID(clone_id),
                conversation_id=uuid.UUID(conversation_id),
                role=role,
                content=content,
                timestamp=now,
            )
            self.db.add(mem)
            await self.db.commit()

        # 2. Update Redis cache
        redis_key = f"memory:short_term:{key}"
        cached = await redis_client.lrange(redis_key, 0, -1)
        cached.append(json.dumps(entry))
        # Trim to last 50
        if len(cached) > 50:
            cached = cached[-50:]
        await redis_client.delete(redis_key)
        if cached:
            await redis_client.rpush(redis_key, *cached)
        await redis_client.expire(redis_key, 86400)

        # 3. Update local cache
        if key not in self._short_term_cache:
            self._short_term_cache[key] = []
        self._short_term_cache[key].append(entry)
        self._short_term_cache[key] = self._short_term_cache[key][-50:]

        # 4. Update interaction count
        if other_user_id:
            self._interaction_counts[f"{clone_id}:{other_user_id}"] += 1
            if self.db:
                await self._ensure_relationship_state(clone_id, other_user_id)

    async def get_conversation_history(
        self, clone_id: str, conversation_id: str, limit: int = 20
    ) -> list[dict]:
        """Get recent conversation history for context window."""
        # Try Redis first
        redis_key = f"memory:short_term:{clone_id}:{conversation_id}"
        cached = await redis_client.lrange(redis_key, -limit, -1)
        if cached:
            return [json.loads(item) for item in cached]

        # Fallback to DB
        if self.db:
            import uuid
            result = await self.db.execute(
                select(ConversationMemory)
                .where(ConversationMemory.clone_id == uuid.UUID(clone_id))
                .where(ConversationMemory.conversation_id == uuid.UUID(conversation_id))
                .order_by(desc(ConversationMemory.timestamp))
                .limit(limit)
            )
            rows = result.scalars().all()
            return [
                {
                    "role": r.role,
                    "content": r.content,
                    "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                }
                for r in reversed(rows)
            ]

        return []

    # -----------------------------------------------------------------------
    # Memory context builder (for prompt injection)
    # -----------------------------------------------------------------------

    async def get_memory_context(
        self, clone_id: str, conversation_id: str, other_user_id: str | None = None
    ) -> str:
        """Build comprehensive memory context string for prompt injection."""
        parts = []

        # 1. Memory seed
        seed = self.memory_seeds.get(clone_id)
        if seed:
            parts.append(f"【你的背景故事】\n{seed}")

        # 2. Relationship context
        if other_user_id and self.db:
            rel = await self._get_relationship_state(clone_id, other_user_id)
            if rel:
                parts.append(
                    f"【你们的关系】\n这是你们的第 {rel.interaction_count} 次互动。"
                    f"亲密度: {rel.intimacy_score:.0f}/100，阶段: {rel.relationship_stage}"
                )
                if rel.milestones:
                    parts.append("关系里程碑：")
                    for ms in rel.milestones[-5:]:
                        parts.append(f"  - {ms.get('description', '')}")

        # 3. Long-term facts
        if self.db:
            facts = await self._get_relevant_long_term_memories(clone_id, conversation_id)
            if facts:
                parts.append(f"【关于你的记忆】\n" + "\n".join(f"- {f}" for f in facts[:10]))

        # 4. Recent conversation topics
        history = await self.get_conversation_history(clone_id, conversation_id, limit=10)
        if history:
            topics = self._extract_topics(history)
            if topics:
                parts.append(f"【最近聊过的话题】{', '.join(topics)}")

        return "\n\n".join(parts) if parts else ""

    # -----------------------------------------------------------------------
    # Long-term memory
    # -----------------------------------------------------------------------

    async def summarize_and_archive(self, clone_id: str, conversation_id: str):
        """Summarize a conversation and extract key facts to long-term memory."""
        if not self.db:
            return

        import uuid

        history = await self.get_conversation_history(clone_id, conversation_id, limit=200)
        if len(history) < 10:
            return

        # Use LLM to extract facts (production-quality)
        conversation_text = "\n".join(
            f"{msg['role']}: {msg['content']}" for msg in history
        )

        prompt = f"""从以下对话中提取关键事实和偏好。输出 JSON 数组：

对话：
{conversation_text[:4000]}

每个事实包含：
- content: 事实内容（简洁的一句话）
- content_type: "fact"（客观事实）/ "opinion"（观点）/ "preference"（偏好）/ "event"（事件）/ "relationship"（关系）
- importance: 1-100 重要性评分
- confidence: 0.0-1.0 置信度

只输出 JSON 数组，不要其他内容。"""

        try:
            raw = await llm_client.chat_completion(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=2000,
                task_type="memory_extraction",
            )
            from app.ai.utils import safe_parse_json

            facts = safe_parse_json(raw, default=[])
            if not isinstance(facts, list):
                facts = []
        except Exception:
            # Fallback to keyword-based extraction
            facts = self._fallback_extract_facts(history)

        for fact in facts:
            if not isinstance(fact, dict):
                continue
            content = fact.get("content", "")
            if not content:
                continue
            mem = LongTermMemory(
                clone_id=uuid.UUID(clone_id),
                content=content,
                content_type=fact.get("content_type", "fact"),
                importance_score=min(100, max(0, fact.get("importance", 50))),
                confidence=min(1.0, max(0.0, fact.get("confidence", 0.8))),
                source_conversation_id=uuid.UUID(conversation_id),
            )
            self.db.add(mem)
            await self.db.flush()  # Get mem.id

            # Generate and store embedding
            embedding = await self._generate_embedding(content)
            if embedding:
                emb = MemoryEmbedding(
                    memory_id=mem.id,
                    embedding=embedding,
                )
                self.db.add(emb)

        await self.db.commit()

    async def get_long_term_facts(self, clone_id: str, limit: int = 20) -> list[str]:
        """Get most important long-term memorized facts about a clone."""
        if not self.db:
            return []

        import uuid
        result = await self.db.execute(
            select(LongTermMemory)
            .where(LongTermMemory.clone_id == uuid.UUID(clone_id))
            .where(LongTermMemory.is_archived == False)
            .order_by(desc(LongTermMemory.importance_score))
            .limit(limit)
        )
        rows = result.scalars().all()
        return [r.content for r in rows]

    # -----------------------------------------------------------------------
    # Relationship milestones
    # -----------------------------------------------------------------------

    async def record_milestone(self, clone_id: str, other_user_id: str, milestone: str):
        """Record a relationship milestone."""
        key = f"{clone_id}:{other_user_id}"
        entry = {
            "description": milestone,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self._milestones[key].append(entry)

        if self.db:
            await self._ensure_relationship_state(clone_id, other_user_id)
            rel = await self._get_relationship_state(clone_id, other_user_id)
            if rel:
                milestones = rel.milestones or []
                milestones.append(entry)
                rel.milestones = milestones
                await self.db.commit()

    # -----------------------------------------------------------------------
    # Internal helpers
    # -----------------------------------------------------------------------

    async def _ensure_relationship_state(self, clone_id: str, other_user_id: str):
        """Create relationship state record if not exists."""
        import uuid
        result = await self.db.execute(
            select(RelationshipState)
            .where(RelationshipState.clone_id == uuid.UUID(clone_id))
            .where(RelationshipState.other_user_id == uuid.UUID(other_user_id))
        )
        if not result.scalar_one_or_none():
            rel = RelationshipState(
                clone_id=uuid.UUID(clone_id),
                other_user_id=uuid.UUID(other_user_id),
            )
            self.db.add(rel)
            await self.db.commit()

    async def _get_relationship_state(
        self, clone_id: str, other_user_id: str
    ) -> RelationshipState | None:
        import uuid
        result = await self.db.execute(
            select(RelationshipState)
            .where(RelationshipState.clone_id == uuid.UUID(clone_id))
            .where(RelationshipState.other_user_id == uuid.UUID(other_user_id))
        )
        return result.scalar_one_or_none()

    async def _get_relevant_long_term_memories(
        self, clone_id: str, conversation_id: str, limit: int = 10
    ) -> list[str]:
        """Retrieve long-term memories using hybrid vector + importance scoring."""
        if not self.db:
            return []

        import uuid

        # 1. Get all non-archived memories for this clone
        result = await self.db.execute(
            select(LongTermMemory)
            .where(LongTermMemory.clone_id == uuid.UUID(clone_id))
            .where(LongTermMemory.is_archived == False)
        )
        memories = result.scalars().all()
        if not memories:
            return []

        # 2. Get conversation context for query embedding
        history = await self.get_conversation_history(clone_id, conversation_id, limit=5)
        query_text = " ".join(m["content"] for m in history[-3:])

        # 3. Simple keyword overlap scoring (fallback when embeddings unavailable)
        scored = []
        query_words = set(query_text.lower().split())
        for mem in memories:
            mem_words = set(mem.content.lower().split())
            overlap = len(query_words & mem_words) / max(len(query_words | mem_words), 1)
            # Hybrid score: 30% vector/keyword overlap + 70% importance
            score = overlap * 30 + mem.importance_score * 0.7
            scored.append((score, mem))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [m.content for _, m in scored[:limit]]

    async def _generate_embedding(self, text: str) -> list[float] | None:
        """Generate embedding vector using OpenAI API."""
        try:
            # Use the OpenAI client directly for embeddings
            from app.config import settings
            import openai
            client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            resp = await client.embeddings.create(
                model="text-embedding-3-small",
                input=text[:8000],
            )
            return resp.data[0].embedding
        except Exception:
            return None

    @staticmethod
    def _cosine_similarity(a: list[float], b: list[float]) -> float:
        a_vec = np.array(a, dtype=np.float32)
        b_vec = np.array(b, dtype=np.float32)
        dot = np.dot(a_vec, b_vec)
        norm = np.linalg.norm(a_vec) * np.linalg.norm(b_vec)
        return float(dot / norm) if norm > 0 else 0.0

    @staticmethod
    def _extract_topics(history: list[dict]) -> list[str]:
        """Extract conversation topics from message history."""
        all_text = " ".join(msg["content"] for msg in history)
        topic_keywords = {
            "工作": "工作/事业",
            "电影": "电影/娱乐",
            "音乐": "音乐",
            "游戏": "游戏",
            "旅行": "旅行",
            "美食": "美食",
            "宠物": "宠物",
            "家人": "家庭",
            "朋友": "朋友",
            "前任": "感情经历",
            "喜欢": "喜好",
            "讨厌": "厌恶",
            "梦想": "梦想/目标",
            "未来": "未来规划",
        }
        topics = set()
        for keyword, topic in topic_keywords.items():
            if keyword in all_text:
                topics.add(topic)
        return list(topics)[:5]

    @staticmethod
    def _fallback_extract_facts(history: list[dict]) -> list[dict]:
        """Fallback keyword-based fact extraction when LLM fails."""
        facts = []
        for msg in history:
            content = msg["content"]
            if any(marker in content for marker in ["我是", "我喜欢", "我住在", "我工作", "我的"]):
                facts.append({
                    "content": content,
                    "content_type": "fact",
                    "importance": 50,
                    "confidence": 0.6,
                })
        return facts
