"""
MemoryManager — 智能记忆管理系统

管理克隆体的对话记忆，结合记忆种子、长期关系记忆和短期上下文。
不是简单的消息存储，而是基于蒸馏人格进行智能摘要和检索。
"""

from datetime import datetime, timezone, timedelta
from collections import defaultdict


class MemoryManager:
    """Manages conversation memory for clones with persona-aware summarization"""

    def __init__(self):
        self.short_term = {}  # clone_id:conversation_id -> list of messages
        self.long_term = {}   # clone_id -> list of relationship memories
        self.memory_seeds = {}  # clone_id -> memory_seed string
        self.interaction_counts = defaultdict(int)  # clone_id:user_id -> count
        self.relationship_milestones = defaultdict(list)  # clone_id:user_id -> milestones

    def load_memory_seed(self, clone_id: str, memory_seed: str):
        """Load the distilled memory seed for a clone"""
        self.memory_seeds[clone_id] = memory_seed

    def add_interaction(self, clone_id: str, conversation_id: str, role: str, content: str, other_user_id: str = None):
        """Record an interaction in short-term memory"""
        key = f"{clone_id}:{conversation_id}"
        if key not in self.short_term:
            self.short_term[key] = []

        self.short_term[key].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # Keep last 50 messages in short-term
        self.short_term[key] = self.short_term[key][-50:]
        
        # Update interaction count
        if other_user_id:
            self.interaction_counts[f"{clone_id}:{other_user_id}"] += 1

    def get_conversation_history(self, clone_id: str, conversation_id: str, limit: int = 20) -> list[dict]:
        """Get recent conversation history for context window"""
        key = f"{clone_id}:{conversation_id}"
        history = self.short_term.get(key, [])
        return history[-limit:]

    def get_memory_context(self, clone_id: str, conversation_id: str, other_user_id: str = None) -> str:
        """
        Build a comprehensive memory context string for prompt injection.
        Includes: memory seed + relationship history + recent conversation summary.
        """
        parts = []
        
        # 1. Memory seed (always present if available)
        seed = self.memory_seeds.get(clone_id)
        if seed:
            parts.append(f"【你的背景故事】\n{seed}")
        
        # 2. Relationship context
        if other_user_id:
            interaction_count = self.interaction_counts.get(f"{clone_id}:{other_user_id}", 0)
            milestones = self.relationship_milestones.get(f"{clone_id}:{other_user_id}", [])
            
            if interaction_count > 0:
                parts.append(f"【你们的关系】\n这是你们的第 {interaction_count} 次互动。")
                
                if milestones:
                    parts.append("关系里程碑：")
                    for ms in milestones[-5:]:
                        parts.append(f"  - {ms}")
        
        # 3. Recent conversation topics
        history = self.get_conversation_history(clone_id, conversation_id, limit=10)
        if history:
            topics = self._extract_topics(history)
            if topics:
                parts.append(f"【最近聊过的话题】{', '.join(topics)}")
        
        return "\n\n".join(parts) if parts else ""

    def record_milestone(self, clone_id: str, other_user_id: str, milestone: str):
        """Record a relationship milestone"""
        key = f"{clone_id}:{other_user_id}"
        self.relationship_milestones[key].append({
            "description": milestone,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    def summarize_and_archive(self, clone_id: str, conversation_id: str):
        """
        Summarize a conversation and move important facts to long-term memory.
        Called periodically or when conversation ends.
        """
        key = f"{clone_id}:{conversation_id}"
        history = self.short_term.get(key, [])
        if len(history) < 10:
            return

        # Extract key facts (simplified - in production this would use LLM)
        facts = []
        for msg in history:
            content = msg["content"]
            # Look for factual statements
            if any(marker in content for marker in ["我是", "我喜欢", "我住在", "我工作", "我的"]):
                facts.append(content)

        if facts:
            if clone_id not in self.long_term:
                self.long_term[clone_id] = []
            
            self.long_term[clone_id].append({
                "conversation_id": conversation_id,
                "facts": facts,
                "summarized_at": datetime.now(timezone.utc).isoformat(),
            })
            
            # Keep only last 100 long-term memories
            self.long_term[clone_id] = self.long_term[clone_id][-100:]

    def _extract_topics(self, history: list[dict]) -> list[str]:
        """Extract conversation topics from message history"""
        all_text = " ".join(msg["content"] for msg in history)
        
        # Simple keyword-based topic extraction
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

    def get_long_term_facts(self, clone_id: str) -> list[str]:
        """Get all long-term memorized facts about a clone"""
        memories = self.long_term.get(clone_id, [])
        facts = []
        for mem in memories:
            facts.extend(mem.get("facts", []))
        return facts[-20:]  # Return last 20 facts
