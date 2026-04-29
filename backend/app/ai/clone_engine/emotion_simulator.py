import random


class EmotionSimulator:
    """Simulates emotional state changes for clones"""

    MOODS = ["happy", "calm", "excited", "thoughtful", "playful", "affectionate"]

    def __init__(self):
        self.states = {}

    def get_current_mood(self, clone_id: str) -> str:
        if clone_id not in self.states:
            self.states[clone_id] = {"mood": "calm", "intensity": 0.5}
        return self.states[clone_id]["mood"]

    def update_from_message(self, clone_id: str, message_content: str):
        """Update mood based on received message sentiment"""
        positive_words = ["喜欢", "开心", "好", "棒", "爱", "想", "见", "约"]
        negative_words = ["不", "讨厌", "忙", "累", "烦", "算了"]

        pos_count = sum(1 for w in positive_words if w in message_content)
        neg_count = sum(1 for w in negative_words if w in message_content)

        if pos_count > neg_count:
            self.states[clone_id] = {"mood": random.choice(["happy", "excited", "affectionate"]), "intensity": 0.7}
        elif neg_count > pos_count:
            self.states[clone_id] = {"mood": "calm", "intensity": 0.3}
        else:
            self.states[clone_id] = {"mood": random.choice(["calm", "thoughtful", "playful"]), "intensity": 0.5}

    def get_mood_description(self, clone_id: str) -> str:
        mood = self.get_current_mood(clone_id)
        descriptions = {
            "happy": "心情愉悦，回复积极",
            "calm": "心态平和，回复稳重",
            "excited": "情绪高涨，回复热情",
            "thoughtful": "陷入思考，回复深沉",
            "playful": "俏皮活泼，回复幽默",
            "affectionate": "温柔体贴，回复暧昧",
        }
        return descriptions.get(mood, "心情一般")
