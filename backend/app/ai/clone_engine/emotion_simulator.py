"""
EmotionSimulator — Persistent emotional state simulation.

Emotional states are persisted to PostgreSQL (emotion_states table) and
loaded on demand. Time-based decay uses real timestamps, driven by Celery beat.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.emotion_state import EmotionState


class EmotionSimulator:
    """Simulates emotional state changes for clones based on distilled persona."""

    def __init__(self, db: AsyncSession | None = None):
        self.db = db
        self.persona_profiles: dict[str, dict] = {}  # clone_id -> emotional profile

    def load_persona(self, clone_id: str, emotional_profile: dict):
        """Load the distilled emotional profile for a clone."""
        self.persona_profiles[clone_id] = emotional_profile

    # -----------------------------------------------------------------------
    # Core mood operations (with DB persistence)
    # -----------------------------------------------------------------------

    async def get_current_mood(self, clone_id: str) -> str:
        state = await self._load_or_create_state(clone_id)
        return state.current_mood or "calm"

    async def get_mood_context(self, clone_id: str) -> dict:
        """Get full mood context for prompt injection."""
        state = await self._load_or_create_state(clone_id)
        profile = self.persona_profiles.get(clone_id, {})

        mood = state.current_mood or "calm"
        emotional_expr = profile.get("emotional_expression", {})

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
            "intensity": state.intensity or 0.5,
            "language_hint": mood_language_map.get(mood, "保持自然"),
            "emoji_tendency": "多用" if mood in ["happy", "excited", "flirty", "affectionate"] else "少用",
        }

    async def update_from_message(
        self,
        clone_id: str,
        message_content: str,
        relationship_depth: float = 0.0,
    ):
        """Update mood based on received message sentiment, using persona-aware logic."""
        profile = self.persona_profiles.get(clone_id, {})
        triggers = profile.get("emotional_vulnerabilities", [])

        # Check for emotional triggers first
        triggered_mood = self._check_triggers(message_content, triggers)

        if triggered_mood:
            intensity = 0.8
            source = "persona_trigger"
        else:
            sentiment = self._analyze_sentiment(message_content, profile)
            attachment = profile.get("attachment_style", "secure")
            triggered_mood = self._sentiment_to_mood(sentiment, attachment, relationship_depth)
            intensity = min(abs(sentiment) * 0.5 + 0.3, 1.0)
            source = "sentiment_analysis"

        await self._save_state(clone_id, triggered_mood, intensity, source)

    # -----------------------------------------------------------------------
    # Time-based decay (called by Celery beat)
    # -----------------------------------------------------------------------

    async def decay_mood(
        self,
        clone_id: str,
        hours_elapsed: float | None = None,
        current_intensity: float | None = None,
    ):
        """Gradually return to calm baseline over time.

        Args:
            hours_elapsed: Hours since last update. If None, loads from DB.
            current_intensity: Current intensity value. If None, loads from DB.
        """
        state = await self._load_state(clone_id)
        if not state:
            return

        if hours_elapsed is None and state.last_update_at:
            hours_elapsed = (datetime.now(timezone.utc) - state.last_update_at).total_seconds() / 3600

        intensity = current_intensity if current_intensity is not None else (state.intensity or 0.5)

        # Exponential decay: ~10% per hour
        decay_factor = 0.9 ** hours_elapsed if hours_elapsed else 0.9
        new_intensity = intensity * decay_factor

        if new_intensity < 0.3:
            await self._save_state(clone_id, "calm", 0.5, "decay")
        else:
            state.intensity = new_intensity
            state.last_update_at = datetime.now(timezone.utc)
            if self.db:
                await self.db.commit()

    # -----------------------------------------------------------------------
    # Internal helpers
    # -----------------------------------------------------------------------

    async def _load_state(self, clone_id: str) -> EmotionState | None:
        if not self.db:
            return None
        import uuid
        result = await self.db.execute(
            select(EmotionState).where(EmotionState.clone_id == uuid.UUID(clone_id))
        )
        return result.scalar_one_or_none()

    async def _load_or_create_state(self, clone_id: str) -> EmotionState:
        if not self.db:
            # Fallback: return ephemeral state
            return EmotionState(
                clone_id=clone_id,  # type: ignore
                current_mood="calm",
                intensity=0.5,
                last_update_at=datetime.now(timezone.utc),
            )

        import uuid
        state = await self._load_state(clone_id)
        if not state:
            state = EmotionState(
                clone_id=uuid.UUID(clone_id),
                current_mood="calm",
                intensity=0.5,
                last_update_at=datetime.now(timezone.utc),
            )
            self.db.add(state)
            await self.db.commit()
        return state

    async def _save_state(
        self, clone_id: str, mood: str, intensity: float, source: str
    ):
        state = await self._load_or_create_state(clone_id)
        now = datetime.now(timezone.utc)

        # Append to mood history
        history = state.mood_history or []
        history.append({
            "mood": mood,
            "intensity": round(intensity, 2),
            "source": source,
            "at": now.isoformat(),
        })
        # Keep last 100 entries
        history = history[-100:]

        state.current_mood = mood
        state.intensity = round(intensity, 2)
        state.last_update_at = now
        state.mood_history = history

        if self.db:
            await self.db.commit()

    def _check_triggers(self, message: str, triggers: list) -> Optional[str]:
        if not triggers:
            return None

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
        """Analyze sentiment score (-1 to 1) with persona-aware weighting."""
        vocab = profile.get("vocabulary_profile", {})
        signature_words = vocab.get("signature_words", [])
        emotional_vulns = profile.get("emotional_vulnerabilities", [])

        # Base sentiment words
        positive_words = ["好", "棒", "喜欢", "开心", "爱", "想", "见", "约", "可爱", "有趣", "赞", "✨", "😊", "😂", "❤️"]
        negative_words = ["不", "讨厌", "忙", "累", "烦", "算了", "别", "差", "糟", "😒", "🙄", "😤"]

        # Add signature words if they indicate sentiment (simple heuristic)
        for word in signature_words:
            if word in ["超", "巨", "贼", "太"]:
                positive_words.append(word)

        pos_count = sum(1 for w in positive_words if w in message)
        neg_count = sum(1 for w in negative_words if w in message)

        # Weight by message intensity
        intensity_mult = 1.0 + message.count("！") * 0.2 + message.count("!") * 0.2

        # Emotional vulnerability amplification
        vuln_bonus = 0
        for vuln in emotional_vulns:
            if vuln in message:
                vuln_bonus = 0.3
                break

        score = (pos_count - neg_count) / max(pos_count + neg_count, 1) * intensity_mult
        score = max(-1.0, min(1.0, score))

        # Amplify if vulnerability triggered
        if vuln_bonus and score < 0:
            score -= vuln_bonus
        return max(-1.0, min(1.0, score))

    def _sentiment_to_mood(
        self, sentiment: float, attachment: str, relationship_depth: float
    ) -> str:
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
