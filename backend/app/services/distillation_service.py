from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.clone_profile import CloneProfile
from app.models.clone import Clone
from app.models.distillation_job import DistillationJob
from app.ai.distillation.persona_distiller import PersonaDistiller
from app.ai.distillation.style_extractor import StyleExtractor
from app.ai.distillation.prompt_forge import PromptForge
from app.ai.distillation.validation import DistillationValidator
from app.ai.utils import truncate_chat_samples, redact_chat_samples


class DistillationService:
    def __init__(self):
        self.distiller = PersonaDistiller()
        self.style_extractor = StyleExtractor()
        self.forge = PromptForge()
        self.validator = DistillationValidator()

    async def distill_user(
        self,
        user_id: str,
        questionnaire: dict,
        chat_samples: list[str],
        social_import: str | None,
        db: AsyncSession,
        progress_callback: callable | None = None,
    ):
        """
        Run the full distillation pipeline.

        Args:
            progress_callback: async callable(step_name, percent) for progress reporting.
        """
        # Token-budget truncation + PII redaction for chat samples
        chat_samples = truncate_chat_samples(chat_samples, max_chars=8000)
        chat_samples = redact_chat_samples(chat_samples)

        # Step 1: Deep persona distillation (4D structured)
        distilled = await self.distiller.distill(
            questionnaire, chat_samples, social_import, use_4d=True
        )
        if progress_callback:
            await progress_callback("extracting_style", 40)

        # Step 2: Style fingerprint extraction (statistical + semantic)
        style_analysis = await self.style_extractor.extract(chat_samples)
        if progress_callback:
            await progress_callback("forging_prompt", 60)

        # Step 3: Forge the system prompt
        forged = await self.forge.forge(distilled, style_analysis)
        if progress_callback:
            await progress_callback("validating", 80)

        # Step 4: Quality validation
        system_prompt = forged.get("system_prompt", "")
        validation = await self.validator.validate(system_prompt, chat_samples or [])

        scores = [
            validation.get("consistency_score", 0),
            validation.get("stability_score", 0),
            validation.get("safety_score", 0),
            validation.get("plausibility_score", 0),
        ]
        overall_score = sum(scores) / max(len(scores), 1)

        if progress_callback:
            await progress_callback("persisting", 95)

        # Step 5: Save to database
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        # Check for existing profile — create new version if exists
        existing_result = await db.execute(
            select(CloneProfile).where(CloneProfile.user_id == user_id)
        )
        existing = existing_result.scalar_one_or_none()
        new_version = (existing.version + 1) if existing else 1

        profile = CloneProfile(
            user_id=user_id,
            questionnaire_answers=questionnaire,
            chat_samples=chat_samples,
            social_import=social_import,
            distilled_persona=distilled.get("persona_core", {}),
            chat_dna=distilled.get("chat_dna", {}),
            emotional_triggers=distilled.get("persona_core", {}).get(
                "emotional_vulnerabilities"
            ),
            decision_patterns=distilled.get("decision_patterns", {}),
            memory_seed=distilled.get("memory_seed", ""),
            system_prompt=system_prompt,
            voice_prompt=forged.get("voice_prompt"),
            behavior_rules=forged.get("behavior_rules", {}),
            autonomy_level=7,
            completion_score=overall_score,
            is_activated=overall_score >= 70,
            version=new_version,
            distillation_meta={
                "model_version": "gpt-4o",
                "distilled_via": "async_pipeline",
            },
        )
        db.add(profile)
        await db.flush()

        # Create or update clone runtime record
        clone_result = await db.execute(
            select(Clone).where(Clone.user_id == user_id)
        )
        clone = clone_result.scalar_one_or_none()
        if clone:
            clone.profile_id = profile.id
            clone.status = "dormant" if overall_score < 70 else "active"
        else:
            clone = Clone(
                user_id=user_id,
                profile_id=profile.id,
                name=f"{user.nickname or 'User'}的在线状态",
                status="dormant" if overall_score < 70 else "active",
            )
            db.add(clone)

        await db.commit()

        return {
            "profile": profile,
            "validation": validation,
            "overall_score": overall_score,
        }

    async def get_active_job(
        self, user_id: str, db: AsyncSession
    ) -> DistillationJob | None:
        """Return any queued or running distillation job for the user."""
        result = await db.execute(
            select(DistillationJob)
            .where(DistillationJob.user_id == user_id)
            .where(DistillationJob.status.in_(["queued", "running"]))
            .order_by(DistillationJob.created_at.desc())
        )
        return result.scalar_one_or_none()
