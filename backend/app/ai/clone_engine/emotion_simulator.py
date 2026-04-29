"""
EmotionSimulator — 高精度情绪状态模拟器

基于蒸馏出的人格档案，模拟用户的情绪反应模式。
不是简单的关键词匹配，而是结合用户的emotional_expression和emotional_triggers进行推理。
"""

import random
from typing import Optional


class EmotionSimulator:
    """Simulates emotional state changes for clones based on distilled persona"""

    def __init__(self):
        self.states = {}  # clone_id -> {mood, intensity, trigger_source, last_update}
        self.persona_profiles = {}  # clone_id -> distilled emotional profile

    def load_persona(self, clone_id: str, emotional_profile: dict):
        """Load the distilled emotional profile for a clone"""
        self.persona_profiles[clone_id] = emotional_profile

    def get_current_mood(self, clone_id: str) -> str:
        if clone_id not in self.states:
            self.states[clone_id] = {
                "mood": "calm",
                "intensity": 0.5,
                "trigger_source": "default",
                "last_update": 0,
            }
        return self.states[clone_id]["mood"]

    def get_mood_context(self, clone_id: str) -> dict:
        """Get full mood context for prompt injection"""
        state = self.states.get(clone_id, {"mood": "calm", "intensity": 0.5})
        profile = self.persona_profiles.get(clone_id, {})
        
        mood = state["mood"]
        emotional_expr = profile.get("emotional_expression", {})
        
        # Map mood to the user's specific language pattern
        mood_language_map = {
            "happy": emotional_expr.get("happy_mode", "开心时话多活泼"),
            "sad": emotional_expr.get("sad_mode", "低落时简短冷淡"),
            "angry": emotional_expr.get("angry_mode", "生气时直接尖锐"),
            "flirty": emotional_expr.get("flirty_mode", "暧昧时温柔试探"),
            "excited": emotional_expr.get("excited_mode", "兴奋时 energetic"),
            "thoughtful": emotional_expr.get("comforting_mode", "思考时深沉"),
            "calm": "心态平和，回复自然",
            "playful": emotional_expr.get("happy_mode", " playful 俏皮"),
            "affectionate": emotional_expr.get("flirty_mode", "温柔体贴"),
        }
        
        return {
            "mood": mood,
            "intensity": state.get("intensity", 0.5),
            "language_hint": mood_language_map.get(mood, "保持自然"),
            "emoji_tendency": "多用" if mood in ["happy", "excited", "flirty", "affectionate"] else "少用",
        }

    def update_from_message(self, clone_id: str, message_content: str, relationship_depth: float = 0.0):
        """
        Update mood based on received message sentiment, using persona-aware logic.
        
        relationship_depth: 0-1, how close the relationship is
        """
        profile = self.persona_profiles.get(clone_id, {})
        triggers = profile.get("emotional_vulnerabilities", [])
        
        # Check for emotional triggers first (highest priority)
        triggered_mood = self._check_triggers(message_content, triggers)
        if triggered_mood:
            self.states[clone_id] = {
                "mood": triggered_mood,
                "intensity": 0.8,
                "trigger_source": "persona_trigger",
                "last_update": random.random(),
            }
            return

        # Then do sentiment analysis with persona-weighted keywords
        sentiment = self._analyze_sentiment(message_content, profile)
        
        # Map sentiment to mood, influenced by attachment style
        attachment = profile.get("attachment_style", "secure")
        mood = self._sentiment_to_mood(sentiment, attachment, relationship_depth)
        
        intensity = abs(sentiment) * 0.5 + 0.3  # Base intensity on sentiment strength
        
        self.states[clone_id] = {
            "mood": mood,
            "intensity": min(intensity, 1.0),
            "trigger_source": "sentiment_analysis",
            "last_update": random.random(),
        }

    def _check_triggers(self, message: str, triggers: list) -> Optional[str]:
        """Check if message hits any emotional trigger"""
        if not triggers:
            return None
            
        # Map common trigger types to moods
        trigger_mood_map = {
            "被忽视": "sad",
            "被误解": "angry",
            "被冷落": "sad",
            "被比较": "angry",
            "背叛": "angry",
            "欺骗": "angry",
            "压力": "thoughtful",
            "焦虑": "thoughtful",
            "孤独": "sad",
        }
        
        message_lower = message.lower()
        for trigger in triggers:
            if trigger.lower() in message_lower:
                return trigger_mood_map.get(trigger, "thoughtful")
        
        # Check for explicit emotional signals in message
        positive_signals = ["喜欢", "爱你", "想你", "约", "见", "一起"]
        negative_signals = ["不", "讨厌", "算了", "忙", "烦", "别", "滚"]
        
        pos_count = sum(1 for s in positive_signals if s in message)
        neg_count = sum(1 for s in negative_signals if s in message)
        
        if pos_count >= 2 and neg_count == 0:
            return "flirty" if any(w in message for w in ["想", "约", "见", "一起"]) else "happy"
        if neg_count >= 2 and pos_count == 0:
            return "angry"
            
        return None

    def _analyze_sentiment(self, message: str, profile: dict) -> float:
        """Analyze sentiment score (-1 to 1) with persona-aware weighting"""
        # User's specific vocabulary
        vocab = profile.get("vocabulary_profile", {})
        signature_words = vocab.get("signature_words", [])
        
        positive_words = ["好", "棒", "喜欢", "开心", "爱", "想", "见", "约", "可爱", "有趣", "赞", "✨", "😊", "😂", "❤️"]
        negative_words = ["不", "讨厌", "忙", "累", "烦", "算了", "别", "差", "糟", "😒", "🙄", "😤"]
        
        pos_count = sum(1 for w in positive_words if w in message)
        neg_count = sum(1 for w in negative_words if w in message)
        
        # Weight by message intensity (exclamation marks, emoji density)
        intensity_mult = 1.0 + message.count("！") * 0.2 + message.count("!") * 0.2
        
        score = (pos_count - neg_count) / max(pos_count + neg_count, 1) * intensity_mult
        return max(-1.0, min(1.0, score))

    def _sentiment_to_mood(self, sentiment: float, attachment: str, relationship_depth: float) -> str:
        """Convert sentiment to mood, influenced by attachment style"""
        
        # Attachment style modifiers
        attachment_modifiers = {
            "anxious": {"positive": "excited", "neutral": "thoughtful", "negative": "sad"},
            "avoidant": {"positive": "calm", "neutral": "calm", "negative": "thoughtful"},
            "secure": {"positive": "happy", "neutral": "calm", "negative": "thoughtful"},
            "fearful": {"positive": "happy", "neutral": "calm", "negative": "sad"},
        }
        
        mod = attachment_modifiers.get(attachment, attachment_modifiers["secure"])
        
        if sentiment > 0.5:
            base = "excited" if relationship_depth > 0.5 else "happy"
            if attachment == "anxious":
                base = "affectionate"
        elif sentiment > 0.1:
            base = mod["positive"]
        elif sentiment > -0.1:
            base = mod["neutral"]
        elif sentiment > -0.5:
            base = mod["negative"]
        else:
            base = "angry" if attachment in ["anxious", "secure"] else "sad"
        
        return base

    def decay_mood(self, clone_id: str):
        """Gradually return to calm baseline over time"""
        if clone_id in self.states:
            state = self.states[clone_id]
            state["intensity"] *= 0.9
            if state["intensity"] < 0.3:
                state["mood"] = "calm"
                state["intensity"] = 0.5
