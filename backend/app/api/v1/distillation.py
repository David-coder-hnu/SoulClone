from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user_id
from app.schemas.clone_profile import DistillationInput, CloneProfileOut
from app.services.distillation_service import DistillationService

router = APIRouter()


@router.post("/start")
async def start_distillation(
    data: DistillationInput,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Start AI distillation process for current user"""
    service = DistillationService()
    result = await service.distill_user(
        user_id=user_id,
        questionnaire=data.questionnaire_answers,
        chat_samples=data.chat_samples or [],
        social_import=data.social_import,
        db=db,
    )
    profile = result["profile"]
    validation = result["validation"]
    overall_score = result["overall_score"]
    
    return {
        "status": "completed",
        "profile_id": str(profile.id),
        "overall_score": overall_score,
        "validation": {
            "consistency_score": validation.get("consistency_score", 0),
            "stability_score": validation.get("stability_score", 0),
            "safety_score": validation.get("safety_score", 0),
            "plausibility_score": validation.get("plausibility_score", 0),
            "critical_gaps": validation.get("critical_gaps", []),
        },
    }


@router.get("/status")
async def get_distillation_status(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get current distillation progress"""
    from sqlalchemy import select
    from app.models.clone_profile import CloneProfile

    result = await db.execute(select(CloneProfile).where(CloneProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        return {"status": "not_started", "completion_score": 0.0, "is_activated": False}

    return {
        "status": "completed" if profile.is_activated else "in_progress",
        "completion_score": float(profile.completion_score),
        "is_activated": profile.is_activated,
    }


@router.get("/profile", response_model=CloneProfileOut)
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get distilled clone profile"""
    from sqlalchemy import select
    from app.models.clone_profile import CloneProfile

    result = await db.execute(select(CloneProfile).where(CloneProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile
