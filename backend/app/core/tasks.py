"""
Celery tasks for SoulClone background operations.
"""

from __future__ import annotations

from celery_worker import celery_app


# ---------------------------------------------------------------------------
# Clone reply task
# ---------------------------------------------------------------------------


@celery_app.task(bind=True, max_retries=2, acks_late=True)
def clone_reply_task(self, job_id: str):
    """Execute one persistent clone reply job."""
    import asyncio

    async def run_and_dispose():
        try:
            await _run_clone_reply_job(
                job_id,
                celery_self=self,
                worker_task_id=self.request.id,
            )
        finally:
            from app.db.session import engine

            await engine.dispose()

    asyncio.run(run_and_dispose())


async def _run_clone_reply_job(
    job_id: str,
    celery_self=None,
    worker_task_id: str | None = None,
):
    import uuid

    from sqlalchemy import select

    from app.core.realtime_events import publish_to_users
    from app.ai.llm_client import LLMGatewayError
    from app.db.session import async_session
    from app.models.clone import Clone
    from app.models.conversation import Conversation
    from app.models.message import Message
    from app.services.clone_reply_job_service import CloneReplyJobService
    from app.services.conversation_control_service import ConversationControlService
    from app.websocket.clone_bridge import CloneBridge

    async with async_session() as db:
        jobs = CloneReplyJobService(db)
        worker_task_id = worker_task_id or f"local:{uuid.uuid4()}"
        job = await jobs.claim(job_id, worker_task_id)
        if job is None:
            return

        source_result = await db.execute(
            select(Message).where(Message.id == job.source_message_id)
        )
        source_message = source_result.scalar_one_or_none()
        clone_result = await db.execute(
            select(Clone).where(Clone.id == job.clone_id)
        )
        clone = clone_result.scalar_one_or_none()
        conversation_result = await db.execute(
            select(Conversation).where(Conversation.id == job.conversation_id)
        )
        conversation = conversation_result.scalar_one_or_none()

        if source_message is None or clone is None or conversation is None:
            await jobs.fail(
                job,
                error_code="job_context_missing",
                error_message="Required message, clone, or conversation was not found",
            )
            return

        owner_user_id = str(clone.user_id)
        participant_ids = [
            str(conversation.participant_a_id),
            str(conversation.participant_b_id),
        ]

        async def publish_status(status: str) -> None:
            await publish_to_users(
                {
                    "type": "clone_reply_status",
                    "job_id": str(job.id),
                    "conversation_id": str(job.conversation_id),
                    "status": status,
                    "attempt_count": job.attempt_count,
                    "trace_id": str(job.trace_id),
                },
                participant_ids,
            )

        try:
            existing_reply_result = await db.execute(
                select(Message).where(
                    Message.sender_id == clone.user_id,
                    Message.client_message_id == job.id,
                )
            )
            existing_reply = existing_reply_result.scalar_one_or_none()
            if existing_reply is not None:
                await jobs.complete(job, existing_reply.id)
                await publish_to_users(
                    {
                        "type": "message",
                        "conversation_id": str(job.conversation_id),
                        "message": {
                            "id": str(existing_reply.id),
                            "sender_id": owner_user_id,
                            "sender_type": "clone",
                            "content": existing_reply.content,
                            "created_at": existing_reply.created_at.isoformat(),
                        },
                    },
                    participant_ids,
                )
                await publish_status("completed")
                return

            allowed, _ = await ConversationControlService(db).clone_reply_allowed(
                job.conversation_id,
                owner_user_id,
                expected_version=job.control_version,
            )
            if not allowed:
                await jobs.cancel(job, "control_changed_before_execution")
                await publish_status("cancelled")
                return

            await publish_status("planning")
            bridge = CloneBridge(db)

            async def update_status(status: str) -> None:
                await jobs.set_status(job, status)
                await publish_status(status)

            reply = await bridge.generate_and_send_clone_reply(
                clone_id=str(clone.id),
                user_id=owner_user_id,
                conversation_id=str(job.conversation_id),
                incoming_message=source_message.content,
                other_user_id=str(source_message.sender_id),
                control_version_at_start=job.control_version,
                status_callback=update_status,
                client_message_id=job.id,
                trace_id=job.trace_id,
            )
            if reply is None:
                allowed, _ = await ConversationControlService(
                    db
                ).clone_reply_allowed(
                    job.conversation_id,
                    owner_user_id,
                    expected_version=job.control_version,
                )
                if not allowed:
                    await jobs.cancel(job, "control_changed_during_generation")
                    await publish_status("cancelled")
                    return
                raise RuntimeError("Clone reply pipeline returned no message")

            await jobs.complete(job, reply.id)
            await publish_status("completed")
        except Exception as exc:
            is_gateway_error = isinstance(exc, LLMGatewayError)
            error_code = exc.code if is_gateway_error else "generation_failed"
            await jobs.fail(
                job,
                error_code=error_code,
                error_message=str(exc),
            )
            await publish_status("failed")
            retryable_gateway_codes = {
                "timeout",
                "rate_limited",
                "provider_unavailable",
                "provider_error",
                "empty_response",
            }
            should_retry = (
                not is_gateway_error or exc.code in retryable_gateway_codes
            )
            if (
                should_retry and celery_self is not None
                and celery_self.request.retries < celery_self.max_retries
            ):
                countdown = 15 * (2 ** celery_self.request.retries)
                raise celery_self.retry(countdown=countdown, exc=exc)
            raise


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
                        "voice_previews": result.get("voice_previews", []),
                        "fidelity": result.get("fidelity", {}),
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
