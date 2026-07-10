"""
ActionPlanner — Personality-driven autonomous behavior engine.

Every decision is driven by the clone's distilled persona dimensions,
not random(). Integrates with EmotionSimulator for mood-aware planning.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone

from app.ai.clone_engine.emotion_simulator import EmotionSimulator


# ---------------------------------------------------------------------------
# Delay mapping: reply_latency → seconds range
# ---------------------------------------------------------------------------

LATENCY_RANGES: dict[str, tuple[int, int]] = {
    "instant":     (5, 60),
    "thoughtful":  (60, 300),
    "slow":        (300, 1800),
    "sporadic":    (60, 3600),
}


def _delay_for_latency(latency: str) -> int:
    """Deterministic-ish delay from latency profile using a simple hash of current minute."""
    lo, hi = LATENCY_RANGES.get(latency, (30, 300))
    # Use the current minute as a seed so the delay varies naturally across
    # the day rather than being identical every time.
    minute = datetime.now(timezone.utc).minute
    # Map minute (0-59) to a position inside the range, with a slight
    # sinusoidal wobble so it's not pure-linear predictable.
    pos = (minute + int(10 * math.sin(minute * 0.3))) / 70
    pos = max(0.0, min(1.0, pos))
    return int(lo + (hi - lo) * pos)


# ---------------------------------------------------------------------------
# Initiative thresholds derived from social_initiative
# ---------------------------------------------------------------------------

INITIATIVE_PROFILES: dict[str, dict[str, float]] = {
    "high": {
        "proactive_chat_chance": 0.75,
        "feed_engage_chance": 0.55,
        "new_match_chance": 0.60,
        "idle_hours_before_action": 3,
    },
    "medium": {
        "proactive_chat_chance": 0.40,
        "feed_engage_chance": 0.25,
        "new_match_chance": 0.30,
        "idle_hours_before_action": 12,
    },
    "low": {
        "proactive_chat_chance": 0.10,
        "feed_engage_chance": 0.05,
        "new_match_chance": 0.10,
        "idle_hours_before_action": 48,
    },
}


class ActionPlanner:
    """Decides what actions a clone should take, driven by personality."""

    def __init__(self, emotion_simulator: EmotionSimulator | None = None):
        self.emotion = emotion_simulator

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def plan_actions(self, clone_state: dict) -> list[dict]:
        """
        Return a ranked list of actions for the clone to execute.

        clone_state must include:
          - clone_id
          - persona: dict with decision_patterns, chat_dna, persona_core
          - pending_messages: list of unread message dicts
          - active_relationships: list of relationship dicts (each with conversation_id,
            intimacy_score, other_user_id, last_interaction_at)
          - autonomy_level: 1-4
        """
        actions: list[dict] = []
        clone_id = clone_state.get("clone_id", "")
        persona = clone_state.get("persona", {})
        decision = persona.get("decision_patterns", {})
        chat_dna = persona.get("chat_dna", {})
        response_patterns = chat_dna.get("response_patterns", {})
        autonomy = clone_state.get("autonomy_level", 1)

        initiative_key = decision.get("social_initiative", "medium")
        profile = INITIATIVE_PROFILES.get(initiative_key, INITIATIVE_PROFILES["medium"])

        # Get current mood to influence decisions
        mood = None
        mood_intensity = 0.5
        if self.emotion:
            try:
                mood_ctx = await self.emotion.get_mood_context(clone_id)
                mood = mood_ctx.get("mood", "calm")
                mood_intensity = mood_ctx.get("intensity", 0.5)
            except Exception:
                pass

        # ── Priority 1: Reply to pending messages  ──
        pending = clone_state.get("pending_messages", [])
        for msg in pending:
            if msg.get("is_read", False):
                continue
            latency = response_patterns.get("reply_latency", "thoughtful")
            actions.append({
                "type": "reply",
                "conversation_id": msg["conversation_id"],
                "message_id": msg["id"],
                "delay_seconds": _delay_for_latency(latency),
                "priority": 1,
            })

        # ── Priority 2: Proactive chat (autonomy ≥ 2)  ──
        if autonomy >= 2 and self._should_act(profile["proactive_chat_chance"], mood, mood_intensity):
            proactive = await self._pick_proactive_chat(
                clone_state, decision, response_patterns, profile
            )
            if proactive:
                proactive["priority"] = 2
                actions.append(proactive)

        # ── Priority 3: Feed engagement (autonomy ≥ 3)  ──
        if autonomy >= 3 and self._should_act(profile["feed_engage_chance"], mood, mood_intensity):
            feed_action = await self._plan_feed_action(clone_state, decision, mood)
            if feed_action:
                feed_action["priority"] = 3
                actions.append(feed_action)

        # ── Priority 4: Seek new matches (autonomy = 4)  ──
        if autonomy == 4 and self._should_act(profile["new_match_chance"], mood, mood_intensity):
            actions.append({
                "type": "discover_matches",
                "criteria": persona.get("persona_core", {}).get("target_profile", {}),
                "delay_seconds": _delay_for_latency("thoughtful"),
                "priority": 4,
            })

        return sorted(actions, key=lambda a: a.get("priority", 99))

    # ------------------------------------------------------------------
    # Decision helpers
    # ------------------------------------------------------------------

    def _should_act(
        self,
        base_chance: float,
        mood: str | None,
        intensity: float,
    ) -> bool:
        """Determine whether to act, modulated by mood and intensity.

        High-energy moods (happy, excited, flirty) increase initiative.
        Low-energy moods (sad, thoughtful) decrease it.
        """
        modifier = 1.0

        if mood in ("happy", "excited", "flirty", "affectionate", "playful"):
            modifier = 1.0 + intensity * 0.3
        elif mood in ("sad", "thoughtful"):
            modifier = 1.0 - intensity * 0.3
        elif mood == "angry":
            # Angry may still act, but differently (handled in action selection)
            modifier = 1.0

        effective = base_chance * modifier
        # Use current hour as a deterministic but time-varying seed so the
        # same clone doesn't fire identically every planning cycle.
        hour_seed = datetime.now(timezone.utc).hour / 24.0
        return (hour_seed + 0.3 * math.sin(hour_seed * math.pi)) < effective

    # ------------------------------------------------------------------
    # Proactive chat: who to talk to
    # ------------------------------------------------------------------

    async def _pick_proactive_chat(
        self,
        clone_state: dict,
        decision: dict,
        response_patterns: dict,
        profile: dict,
    ) -> dict | None:
        """Choose which conversation to proactively engage, if any."""
        relationships = clone_state.get("active_relationships", [])
        if not relationships:
            return None

        now = datetime.now(timezone.utc)
        idle_hours = profile["idle_hours_before_action"]
        attachment = decision.get("attachment_style", "secure")

        # Score each relationship: prefer high intimacy + idle long enough
        candidates: list[tuple[float, dict]] = []
        for rel in relationships:
            intimacy = rel.get("intimacy_score", 0)
            last_str = rel.get("last_interaction_at")
            hours_idle = 0.0
            if last_str:
                try:
                    last_dt = datetime.fromisoformat(last_str)
                    hours_idle = (now - last_dt).total_seconds() / 3600
                except (ValueError, TypeError):
                    pass

            # Only consider relationships that have been idle long enough
            if hours_idle < idle_hours:
                continue

            # Attachment-style weighting
            match attachment:
                case "anxious":
                    # Prefers high-intimacy, anxious about silence
                    score = intimacy * 0.8 + min(hours_idle / 48, 1.0) * 20
                case "avoidant":
                    # Prefers low-pressure, low-intimacy
                    score = (100 - intimacy) * 0.5 + min(hours_idle / 72, 1.0) * 15
                case "secure":
                    score = intimacy * 0.6 + min(hours_idle / 24, 1.0) * 30
                case _:  # fearful
                    # Mixed: slightly prefers familiar but cautious
                    score = intimacy * 0.3 + min(hours_idle / 24, 1.0) * 10

            candidates.append((score, rel))

        if not candidates:
            return None

        candidates.sort(key=lambda x: x[0], reverse=True)
        best = candidates[0][1]

        latency = response_patterns.get("reply_latency", "thoughtful")
        return {
            "type": "send_message",
            "conversation_id": best["conversation_id"],
            "other_user_id": best.get("other_user_id"),
            "context": "proactive_check_in",
            "delay_seconds": _delay_for_latency(latency),
        }

    # ------------------------------------------------------------------
    # Feed engagement: what to do
    # ------------------------------------------------------------------

    async def _plan_feed_action(
        self,
        clone_state: dict,
        decision: dict,
        mood: str | None,
    ) -> dict | None:
        """Decide feed engagement: like, comment, or post."""
        risk = decision.get("risk_appetite", "medium")
        directness = (
            clone_state.get("persona", {})
            .get("chat_dna", {})
            .get("tone_spectrum", {})
            .get("directness", 5)
        )

        # Determine what kind of engagement fits this personality
        actions: list[str] = ["like"]

        # Comment only if risk appetite allows (commenting is public and risky)
        if risk in ("high",) and directness >= 5:
            actions.append("comment")
        elif risk == "medium" and directness >= 7:
            actions.append("comment")

        # Post only if high social initiative + not sad/angry
        initiative = decision.get("social_initiative", "medium")
        if initiative == "high" and mood not in ("sad", "angry"):
            if risk in ("high", "medium"):
                actions.append("post")

        # Mood tweaks: sad → less, excited → more
        if mood == "sad":
            actions = [a for a in actions if a != "post"]
        elif mood in ("excited", "happy", "playful") and "post" not in actions:
            if initiative == "high":
                actions.append("post")

        return {
            "type": "browse_feed",
            "actions": actions,
            "delay_seconds": _delay_for_latency("thoughtful"),
        }
