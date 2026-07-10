"""
FidelityScorer — Computes how closely a clone matches its human source.

Three dimensions weighted into a single fidelity score (0-100):
  1. Base consistency (40%) — questionnaire self-consistency
  2. Behavioral alignment (40%) — embedding cosine similarity between
     real user messages and clone-generated responses
  3. Calibration depth (20%) — how much data the user invested
"""

from __future__ import annotations


class FidelityScorer:
    """Computes clone fidelity across three dimensions."""

    # ------------------------------------------------------------------
    # Dimension 1: Base consistency (0-100)
    # ------------------------------------------------------------------

    def score_base_consistency(self, questionnaire: dict) -> float:
        """
        Measure internal consistency of questionnaire answers.

        Looks for contradictory signals across related questions, e.g.:
        - Claims high social energy but also high social avoidance
        - Claims risk-loving but also high caution
        - Claims emotional expressiveness but also emotional hiding
        """
        if not questionnaire:
            return 50.0

        checks: list[tuple[bool, float]] = []

        # Extract relevant fields (works with both flat and nested structures)
        def _get(path: str, default=None):
            keys = path.split(".")
            val = questionnaire
            for k in keys:
                if isinstance(val, dict):
                    val = val.get(k, default)
                else:
                    return default
            return val

        social_energy = _get("social_energy")
        social_avoidance = _get("social_avoidance")
        if social_energy is not None and social_avoidance is not None:
            # Perfectly consistent: social_energy + social_avoidance = 6
            # Contradiction level: distance from perfect consistency (0 = best, 5 = worst)
            contradiction = abs(social_energy - (6 - social_avoidance))
            # Invert: 0 contradiction → 100 consistency, 5 contradiction → 0 consistency
            score = max(0.0, 100 - (contradiction / 5.0) * 100)
            checks.append((True, score))

        risk_love = _get("risk_love")
        caution = _get("caution")
        if risk_love is not None and caution is not None:
            contradiction = abs(risk_love - (6 - caution))
            score = max(0.0, 100 - (contradiction / 5.0) * 100)
            checks.append((True, score))

        emotional_express = _get("emotional_express")
        emotional_hide = _get("emotional_hide")
        if emotional_express is not None and emotional_hide is not None:
            contradiction = abs(emotional_express - (6 - emotional_hide))
            score = max(0.0, 100 - (contradiction / 5.0) * 100)
            checks.append((True, score))

        # Count how many questions were answered (completeness)
        answered = sum(
            1 for v in questionnaire.values()
            if v is not None and v != "" and v != []
        )
        total = max(len(questionnaire), 1)
        completeness = (answered / total) * 100

        if checks:
            avg_consistency = sum(score for _, score in checks) / len(checks)
        else:
            avg_consistency = 70.0

        return avg_consistency * 0.7 + completeness * 0.3

    # ------------------------------------------------------------------
    # Dimension 2: Behavioral alignment (0-100)
    # ------------------------------------------------------------------

    async def score_behavioral_alignment(
        self,
        real_messages: list[str],
        clone_responses: list[str],
    ) -> float:
        """
        Compare clone-generated responses against real user messages
        using embedding cosine similarity.

        Args:
            real_messages: User's actual chat messages (ground truth).
            clone_responses: Clone's generated responses to the same prompts.

        Returns:
            Alignment score 0-100.
        """
        if not real_messages or not clone_responses:
            return 50.0

        # Truncate to most recent for efficiency
        real_sample = real_messages[-20:]
        clone_sample = clone_responses[-20:]

        real_emb = await self._batch_embed(real_sample)
        clone_emb = await self._batch_embed(clone_sample)

        if not real_emb or not clone_emb:
            return 50.0

        # Compute pairwise cosine similarities and average
        similarities: list[float] = []
        n = min(len(real_emb), len(clone_emb))
        for i in range(n):
            sim = self._cosine_similarity(real_emb[i], clone_emb[i])
            similarities.append(sim)

        if not similarities:
            return 50.0

        avg_sim = sum(similarities) / len(similarities)
        # Cosine similarity of 0.7+ indicates strong alignment
        # Map to 0-100: similarity < 0.3 → 0, > 0.95 → 100
        score = max(0.0, min(100.0, (avg_sim - 0.3) / 0.65 * 100))
        return round(score, 1)

    # ------------------------------------------------------------------
    # Dimension 3: Calibration depth (0-100)
    # ------------------------------------------------------------------

    def score_calibration_depth(
        self,
        questionnaire_completeness: float = 0.0,
        chat_sample_count: int = 0,
        calibration_iterations: int = 0,
        social_import_provided: bool = False,
    ) -> float:
        """
        Measure how much effort the user invested in training their clone.

        - Questionnaire completeness: 0-40 points
        - Chat sample volume: 0-30 points (0 samples → 0, 30+ → 30)
        - Calibration iterations: 0-20 points (0 → 0, 5+ → 20)
        - Social import bonus: 0-10 points
        """
        score = 0.0

        # Questionnaire (0-40)
        score += min(40.0, questionnaire_completeness * 40)

        # Chat samples (0-30)
        score += min(30.0, (chat_sample_count / 30) * 30)

        # Calibration iterations (0-20)
        score += min(20.0, (calibration_iterations / 5) * 20)

        # Social import bonus (0-10)
        if social_import_provided:
            score += 10.0

        return min(100.0, score)

    # ------------------------------------------------------------------
    # Composite fidelity score
    # ------------------------------------------------------------------

    def compute_fidelity(
        self,
        base_consistency: float,
        behavioral_alignment: float,
        calibration_depth: float,
        *,
        behavioral_status: str = "computed",
    ) -> dict:
        """
        Combine three dimensions into a composite fidelity score with tier.

        Weights:
          - Base consistency: 40%
          - Behavioral alignment: 40%
          - Calibration depth: 20%

        Args:
            behavioral_status: "computed" (normal), "degraded" (embedding API failed),
                or "insufficient_data" (not enough samples).
        """
        composite = (
            base_consistency * 0.40 +
            behavioral_alignment * 0.40 +
            calibration_depth * 0.20
        )
        composite = round(min(100.0, max(0.0, composite)), 1)

        tier = self._score_to_tier(composite)

        return {
            "overall": composite,
            "tier": tier["label"],
            "tier_description": tier["description"],
            "status": behavioral_status,
            "dimensions": {
                "base_consistency": round(base_consistency, 1),
                "behavioral_alignment": round(behavioral_alignment, 1),
                "calibration_depth": round(calibration_depth, 1),
            },
            "weights": {
                "base_consistency": 0.40,
                "behavioral_alignment": 0.40,
                "calibration_depth": 0.20,
            },
        }

    # ------------------------------------------------------------------
    # Tier system
    # ------------------------------------------------------------------

    @staticmethod
    def _score_to_tier(score: float) -> dict:
        if score >= 85:
            return {
                "label": "精良级",
                "description": "这个孪生高度还原了本人的说话方式、情绪反应和决策模式。对方可以放心交流。",
            }
        elif score >= 65:
            return {
                "label": "稳固级",
                "description": "孪生在大方向上准确，偶有偏差但整体可信。建议继续校准以提升精度。",
            }
        elif score >= 40:
            return {
                "label": "初级",
                "description": "基础人格框架已建立，但行为细节和语言风格还不够精准。建议投入更多训练数据。",
            }
        else:
            return {
                "label": "待校准",
                "description": "训练数据不足，孪生与本人的一致性尚未建立。建议完成完整问卷和聊天样本提交。",
            }

    # ------------------------------------------------------------------
    # Embedding helpers
    # ------------------------------------------------------------------

    async def _batch_embed(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a batch of texts."""
        try:
            from app.ai.llm_client import llm_client

            return await llm_client.embeddings(
                texts,
                model="text-embedding-3-small",
            )
        except Exception:
            return []

    @staticmethod
    def _cosine_similarity(a: list[float], b: list[float]) -> float:
        import numpy as np
        a_vec = np.array(a, dtype=np.float32)
        b_vec = np.array(b, dtype=np.float32)
        dot = float(np.dot(a_vec, b_vec))
        norm = float(np.linalg.norm(a_vec) * np.linalg.norm(b_vec))
        return dot / norm if norm > 0 else 0.0
