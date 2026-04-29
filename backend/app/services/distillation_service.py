from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.clone_profile import CloneProfile
from app.models.clone import Clone
from app.ai.distillation.persona_distiller import PersonaDistiller
from app.ai.distillation.style_extractor import StyleExtractor
from app.ai.distillation.prompt_forge import PromptForge
from app.ai.distillation.validation import DistillationValidator


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
    ):
        # Step 1: Deep persona distillation
        distilled = await self.distiller.distill(questionnaire, chat_samples, social_import)

        # Step 2: Style fingerprint extraction (statistical + semantic)
        style_analysis = await self.style_extractor.extract(chat_samples)

        # Step 3: Forge the system prompt
        forged = await self.forge.forge(distilled, style_analysis)

        # Step 4: Quality validation
        system_prompt = forged.get("system_prompt", "")
        validation = await self.validator.validate(system_prompt, chat_samples or [])
        
        # Calculate overall score
        scores = [
            validation.get("consistency_score", 0),
            validation.get("stability_score", 0),
            validation.get("safety_score", 0),
            validation.get("plausibility_score", 0),
        ]
        overall_score = sum(scores) / max(len(scores), 1)

        # Step 5: Save to database
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        profile = CloneProfile(
            user_id=user_id,
            questionnaire_answers=questionnaire,
            chat_samples=chat_samples,
            social_import=social_import,
            distilled_persona=distilled.get("persona_core", {}),
            chat_dna=distilled.get("chat_dna", {}),
            emotional_triggers=distilled.get("persona_core", {}).get("emotional_vulnerabilities"),
            decision_patterns=distilled.get("decision_patterns", {}),
            memory_seed=distilled.get("memory_seed", ""),
            system_prompt=system_prompt,
            voice_prompt=forged.get("voice_prompt"),
            behavior_rules=forged.get("behavior_rules", {}),
            autonomy_level=7,
            completion_score=overall_score,
            is_activated=overall_score >= 70,  # Only auto-activate if quality is sufficient
        )
        db.add(profile)
        await db.flush()

        # Create clone runtime record
        clone = Clone(
            user_id=user_id,
            profile_id=profile.id,
            name=f"{user.nickname or 'User'}的在线状态",
            status="dormant" if overall_score < 70 else "active",
        )
        db.add(clone)

        # Update user status
        user.status = "active"
        await db.commit()

        return {
            "profile": profile,
            "validation": validation,
            "overall_score": overall_score,
        }
