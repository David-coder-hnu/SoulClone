"""
Celery tasks for SoulClone background operations.
"""

from __future__ import annotations

from celery_worker import celery_app


# ---------------------------------------------------------------------------
# Distillation pipeline task
# ---------------------------------------------------------------------------

@celery_app.task(bind=True, max_retries=2)
def distill_user_task(self, job_id: str):
    """
    Background task for AI personality distillation.

    Runs the 5-step pipeline asynchronously and updates job progress in Redis.
    """
    import asyncio
    asyncio.run(_run_distillation(job_id, celery_self=self))


async def _run_distillation(job_id: str, celery_self=None):
    import uuid
    from datetime import datetime, timezone

    from sqlalchemy import select
    from app.db.session import async_session
    from app.models.distillation_job import DistillationJob
    from app.models.user import User
    from app.services.distillation_service import DistillationService
    from app.core.redis_client import redis_client

    async with async_session() as db:
        # Load job
        result = await db.execute(
            select(DistillationJob).where(DistillationJob.id == uuid.UUID(job_id))
        )
        job = result.scalar_one_or_none()
        if not job:
            raise ValueError(f"DistillationJob {job_id} not found")

        # Load user
        user_result = await db.execute(select(User).where(User.id == job.user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            raise ValueError(f"User {job.user_id} not found")

        # Update job to running
        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        await db.commit()

        service = DistillationService()

        import json

        # Step progress helper
        async def set_progress(step: str, percent: int):
            job.current_step = step
            job.progress_percent = percent
            await db.commit()
            await redis_client.set(
                f"distillation:progress:{job_id}",
                json.dumps({"step": step, "percent": percent, "status": "running"}),
                ex=3600,
            )

        try:
            # Retrieve input data from Redis (stashed by API before queuing)
            input_key = f"distillation:input:{job_id}"
            input_data = await redis_client.get(input_key)
            if not input_data:
                raise ValueError(f"Input data for job {job_id} not found in Redis")
            inputs = json.loads(input_data)

            await set_progress("distilling_persona", 20)

            result = await service.distill_user(
                user_id=str(job.user_id),
                questionnaire=inputs["questionnaire"],
                chat_samples=inputs.get("chat_samples", []),
                social_import=inputs.get("social_import"),
                db=db,
                progress_callback=set_progress,
            )

            # Mark completed
            job.status = "completed"
            job.progress_percent = 100
            job.current_step = "persisting"
            job.completed_at = datetime.now(timezone.utc)
            job.result = {
                "profile_id": str(result["profile"].id),
                "overall_score": result["overall_score"],
            }
            await db.commit()

            # Update user status
            user.status = "active"
            await db.commit()

            # Notify Redis
            await redis_client.set(
                f"distillation:progress:{job_id}",
                json.dumps(
                    {
                        "step": "completed",
                        "percent": 100,
                        "status": "completed",
                        "profile_id": str(result["profile"].id),
                        "overall_score": result["overall_score"],
                    }
                ),
                ex=3600,
            )

        except Exception as exc:
            job.status = "failed"
            job.error_message = str(exc)
            job.completed_at = datetime.now(timezone.utc)
            await db.commit()

            # Use a valid enum value — "suspended" is the closest to "failed"
            # (distilling/active/suspended are the only allowed values)
            user.status = "suspended"
            await db.commit()

            await redis_client.set(
                f"distillation:progress:{job_id}",
                json.dumps(
                    {
                        "step": "failed",
                        "percent": job.progress_percent,
                        "status": "failed",
                        "error": str(exc),
                    }
                ),
                ex=3600,
            )

            # Celery retry
            if celery_self is not None and celery_self.request.retries < celery_self.max_retries:
                raise celery_self.retry(countdown=60, exc=exc)
            raise


# ---------------------------------------------------------------------------
# Clone runtime periodic task
# ---------------------------------------------------------------------------

@celery_app.task
def run_clone_cycle():
    """Periodic task to evaluate and execute clone actions."""
    import asyncio
    asyncio.run(_run_clone_cycle())


async def _run_clone_cycle():
    from app.services.clone_runtime_service import CloneRuntimeService
    from app.db.session import async_session

    async with async_session() as db:
        service = CloneRuntimeService(db)
        await service.evaluate_cycle()


# ---------------------------------------------------------------------------
# Emotion decay periodic task
# ---------------------------------------------------------------------------

@celery_app.task
def decay_emotions():
    """Periodic task to decay clone emotional states over time."""
    import asyncio
    asyncio.run(_decay_emotions())


async def _decay_emotions():
    from sqlalchemy import select
    from app.db.session import async_session
    from app.models.emotion_state import EmotionState
    from app.ai.clone_engine.emotion_simulator import EmotionSimulator
    from datetime import datetime, timezone

    async with async_session() as db:
        result = await db.execute(select(EmotionState))
        states = result.scalars().all()

        simulator = EmotionSimulator()
        now = datetime.now(timezone.utc)

        for state in states:
            # Decay based on elapsed time since last update
            if state.last_update_at:
                elapsed_hours = (now - state.last_update_at).total_seconds() / 3600
                if elapsed_hours > 0:
                    simulator.decay_mood(
                        str(state.clone_id),
                        hours_elapsed=elapsed_hours,
                        current_intensity=state.intensity,
                    )
                    # Note: actual DB update is handled by the simulator now
