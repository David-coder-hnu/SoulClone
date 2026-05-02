from __future__ import annotations
import uuid


import json

from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.dependencies import get_db, get_current_user_id
from app.schemas.clone_profile import DistillationInput
from app.services.distillation_service import DistillationService
from app.core.redis_client import redis_client
from app.models.distillation_job import DistillationJob
from app.models.user import User
from app.config import settings

router = APIRouter()


# ---------------------------------------------------------------------------
# Start distillation (async)
# ---------------------------------------------------------------------------

@router.post("/start")
async def start_distillation(
    data: DistillationInput,
    background_tasks: BackgroundTasks,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Start AI distillation process asynchronously. Returns a job ID."""
    service = DistillationService()

    # Idempotency: reject if already has active job
    active_job = await service.get_active_job(user_id, db)
    if active_job:
        return {
            "job_id": str(active_job.id),
            "status": active_job.status,
            "message": "Distillation already in progress",
        }

    # Create job record
    job = DistillationJob(
        user_id=user_id,
        status="queued",
        progress_percent=5,
    )
    db.add(job)
    await db.commit()

    # Stash input data in Redis for the Celery worker
    await redis_client.set(
        f"distillation:input:{job.id}",
        json.dumps(
            {
                "questionnaire": data.questionnaire_answers,
                "chat_samples": data.chat_samples or [],
                "social_import": data.social_import,
            }
        ),
        ex=3600,
    )

    # Update user status
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if user:
        user.status = "distilling"
        await db.commit()

    # Queue task
    from app.core.tasks import distill_user_task, _run_distillation

    if settings.is_development:
        # Dev mode: no Celery worker needed. Runs in a background thread
        # so the HTTP response returns immediately. This removes the need
        # to start a separate worker process in development.
        def _sync_wrapper():
            import asyncio
            asyncio.run(_run_distillation(str(job.id), celery_self=None))

        background_tasks.add_task(_sync_wrapper)
    else:
        # Production: use Celery worker queue
        distill_user_task.delay(str(job.id))

    return {
        "job_id": str(job.id),
        "status": "queued",
        "progress_percent": 5,
    }


# ---------------------------------------------------------------------------
# Poll progress
# ---------------------------------------------------------------------------

@router.get("/progress/{job_id}")
async def get_distillation_progress(
    job_id: str,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get current distillation progress (polling endpoint)."""
    # First check Redis for real-time updates
    redis_data = await redis_client.get(f"distillation:progress:{job_id}")
    if redis_data:
        parsed = json.loads(redis_data)
        return {
            "job_id": job_id,
            "status": parsed.get("status"),
            "step": parsed.get("step"),
            "progress_percent": parsed.get("percent"),
            "overall_score": parsed.get("overall_score"),
            "profile_id": parsed.get("profile_id"),
            "error": parsed.get("error"),
        }

    # Fallback to database
    result = await db.execute(
        select(DistillationJob).where(DistillationJob.id == uuid.UUID(job_id))
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job_id,
        "status": job.status,
        "step": job.current_step,
        "progress_percent": job.progress_percent,
        "error": job.error_message,
    }


# ---------------------------------------------------------------------------
# SSE progress stream
# ---------------------------------------------------------------------------

@router.get("/progress/sse")
async def distillation_progress_sse(
    job_id: str,
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Server-Sent Events stream for real-time distillation progress."""
    from asyncio import sleep

    async def event_generator():
        last_status = None
        while True:
            redis_data = await redis_client.get(f"distillation:progress:{job_id}")
            if redis_data:
                parsed = json.loads(redis_data)
                status = parsed.get("status")
                if status != last_status:
                    last_status = status
                    yield f"data: {json.dumps(parsed)}\n\n"

                if status in ("completed", "failed"):
                    break
            else:
                # Fallback: check DB
                from app.db.session import async_session
                async with async_session() as db:
                    result = await db.execute(
                        select(DistillationJob).where(
                            DistillationJob.id == uuid.UUID(job_id)
                        )
                    )
                    job = result.scalar_one_or_none()
                    if job and job.status in ("completed", "failed"):
                        payload = {
                            "status": job.status,
                            "step": job.current_step,
                            "percent": job.progress_percent,
                            "error": job.error_message,
                        }
                        yield f"data: {json.dumps(payload)}\n\n"
                        break

            await sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


# ---------------------------------------------------------------------------
# Legacy status endpoint (redirects to progress)
# ---------------------------------------------------------------------------

@router.get("/status")
async def get_distillation_status(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get current distillation status for the user."""
    from app.models.clone_profile import CloneProfile

    result = await db.execute(
        select(CloneProfile).where(CloneProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        # Check if there's an active job
        service = DistillationService()
        active_job = await service.get_active_job(user_id, db)
        if active_job:
            return {
                "status": active_job.status,
                "completion_score": 0.0,
                "is_activated": False,
                "job_id": str(active_job.id),
            }
        return {"status": "not_started", "completion_score": 0.0, "is_activated": False}

    return {
        "status": "completed" if profile.is_activated else "in_progress",
        "completion_score": float(profile.completion_score),
        "is_activated": profile.is_activated,
        "version": profile.version,
    }


# ---------------------------------------------------------------------------
# Profile endpoint
# ---------------------------------------------------------------------------

@router.get("/profile")
async def get_profile(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get distilled clone profile."""
    from app.models.clone_profile import CloneProfile
    from app.schemas.clone_profile import CloneProfileOut

    result = await db.execute(
        select(CloneProfile).where(CloneProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return CloneProfileOut.model_validate(profile)


@router.delete("/profile")
async def delete_profile(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete all distillation data for the user (GDPR right to erasure)."""
    from app.models.clone_profile import CloneProfile
    from app.models.clone import Clone
    from app.models.conversation_memory import ConversationMemory
    from app.models.long_term_memory import LongTermMemory
    from app.models.emotion_state import EmotionState
    from app.models.relationship_state import RelationshipState
    from app.models.calibration_test import CalibrationTest
    from app.models.calibration_refinement import CalibrationRefinement
    from app.models.distillation_job import DistillationJob

    uid = user_id

    # Delete all related data
    for model in [
        CalibrationTest, CalibrationRefinement, DistillationJob,
        ConversationMemory, LongTermMemory, EmotionState,
        RelationshipState, Clone, CloneProfile,
    ]:
        if hasattr(model, "user_id"):
            await db.execute(model.__table__.delete().where(model.user_id == uid))
        elif model.__name__ == "Clone":
            await db.execute(model.__table__.delete().where(model.user_id == uid))

    await db.commit()
    return {"status": "deleted", "message": "All distillation data has been permanently removed"}


@router.get("/export")
async def export_profile(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Export all user distillation data (GDPR right to data portability)."""
    from app.models.clone_profile import CloneProfile
    from app.models.clone import Clone
    from app.models.calibration_test import CalibrationTest
    from app.models.calibration_refinement import CalibrationRefinement

    uid = user_id

    profile_result = await db.execute(
        select(CloneProfile).where(CloneProfile.user_id == uid)
    )
    profile = profile_result.scalar_one_or_none()

    clone_result = await db.execute(select(Clone).where(Clone.user_id == uid))
    clone = clone_result.scalar_one_or_none()

    tests_result = await db.execute(
        select(CalibrationTest).where(CalibrationTest.user_id == uid)
    )
    tests = tests_result.scalars().all()

    refinements_result = await db.execute(
        select(CalibrationRefinement).where(CalibrationRefinement.user_id == uid)
    )
    refinements = refinements_result.scalars().all()

    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "profile": {
            "distilled_persona": profile.distilled_persona if profile else None,
            "chat_dna": profile.chat_dna if profile else None,
            "version": profile.version if profile else None,
            "distilled_at": profile.distilled_at.isoformat() if profile and profile.distilled_at else None,
        },
        "clone": {
            "status": clone.status if clone else None,
            "total_messages_sent": clone.total_messages_sent if clone else None,
        },
        "calibration_tests": [
            {"scenario": t.scenario, "analysis": t.analysis, "created_at": t.created_at.isoformat() if t.created_at else None}
            for t in tests
        ],
        "calibration_refinements": [
            {"version": r.profile_version, "confidence": r.confidence, "changes": r.changes_made, "created_at": r.created_at.isoformat() if r.created_at else None}
            for r in refinements
        ],
    }