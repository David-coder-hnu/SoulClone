from datetime import datetime, timezone


class MemoryManager:
    """Manages conversation memory for clones"""

    def __init__(self):
        self.memories = {}

    def add_interaction(self, clone_id: str, conversation_id: str, role: str, content: str):
        key = f"{clone_id}:{conversation_id}"
        if key not in self.memories:
            self.memories[key] = []

        self.memories[key].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # Keep last 50 messages
        self.memories[key] = self.memories[key][-50:]

    def get_conversation_history(self, clone_id: str, conversation_id: str) -> list[dict]:
        key = f"{clone_id}:{conversation_id}"
        return self.memories.get(key, [])

    def summarize_memory(self, clone_id: str, conversation_id: str) -> str:
        history = self.get_conversation_history(clone_id, conversation_id)
        if not history:
            return ""

        # Simple summary: key topics and emotional tone
        topics = set()
        for msg in history:
            words = msg["content"].split()
            for word in words:
                if len(word) > 3:
                    topics.add(word)

        return f"对话涉及话题: {', '.join(list(topics)[:10])}"
