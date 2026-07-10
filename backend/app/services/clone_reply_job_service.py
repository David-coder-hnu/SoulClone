from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.clone_reply_job import CloneReplyJob


ACTIVE_JOB_STATUSES = {
    "planning",
    "context_loading",
    "generating",
    "waiting",
    "validating",
    "delivering",
}
TERMINAL_JOB_STATUSES = {"completed", "cancelled"}
JOB_LEASE_SECONDS = 660


class CloneReplyJobService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_or_get(
        self,
        *,
        source_message_id: str | uuid.UUID,
        conversation_id: str | uuid.UUID,
        clone_id: str | uuid.UUID,
        control_version: int,
    ) -> tuple[CloneReplyJob, bool]:
        source_uuid = self._as_uuid(source_message_id)
        clone_uuid = self._as_uuid(clone_id)
        existing = await self._get_by_source(source_uuid)
        if existing is not None:
            return existing, False

        job = CloneReplyJob(
            source_message_id=source_uuid,
            conversation_id=self._as_uuid(conversation_id),
            clone_id=clone_uuid,
            status="queued",
            idempotency_key=f"clone-reply:{source_uuid}:{clone_uuid}",
            control_version=control_version,
            model=settings.DEFAULT_LLM_MODEL,
            trace_id=uuid.uuid4(),
        )
        self.db.add(job)
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            existing = await self._get_by_source(source_uuid)
            if existing is None:
                raise
            return existing, False
        await self.db.refresh(job)
        return job, True

    async def claim(
        self,
        job_id: str | uuid.UUID,
        worker_task_id: str,
    ) -> CloneReplyJob | None:
        result = await self.db.execute(
            select(CloneReplyJob)
            .where(CloneReplyJob.id == self._as_uuid(job_id))
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        job = result.scalar_one_or_none()
        if job is None or job.status in TERMINAL_JOB_STATUSES:
            return None
        now = datetime.now(timezone.utc)
        if job.status in ACTIVE_JOB_STATUSES:
            lease_is_active = (
                job.lease_expires_at is not None
                and self._as_utc(job.lease_expires_at) > now
            )
            is_same_redelivered_task = job.worker_task_id == worker_task_id
            if lease_is_active and not is_same_redelivered_task:
                return None

        job.status = "planning"
        job.attempt_count += 1
        job.started_at = job.started_at or now
        job.worker_task_id = worker_task_id
        job.lease_expires_at = now + timedelta(seconds=JOB_LEASE_SECONDS)
        job.error_code = None
        job.error_message = None
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def set_status(self, job: CloneReplyJob, status: str) -> None:
        if job.status in TERMINAL_JOB_STATUSES:
            return
        job.status = status
        job.lease_expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=JOB_LEASE_SECONDS
        )
        await self.db.commit()

    async def complete(
        self,
        job: CloneReplyJob,
        reply_message_id: str | uuid.UUID,
    ) -> None:
        job.status = "completed"
        job.reply_message_id = self._as_uuid(reply_message_id)
        job.completed_at = datetime.now(timezone.utc)
        job.error_code = None
        job.error_message = None
        job.lease_expires_at = None
        await self.db.commit()

    async def cancel(self, job: CloneReplyJob, reason: str) -> None:
        job.status = "cancelled"
        job.cancel_reason = reason[:100]
        job.cancelled_at = datetime.now(timezone.utc)
        job.lease_expires_at = None
        await self.db.commit()

    async def fail(
        self,
        job: CloneReplyJob,
        *,
        error_code: str,
        error_message: str,
    ) -> None:
        job.status = "failed"
        job.error_code = error_code[:50]
        job.error_message = error_message[:2000]
        job.lease_expires_at = None
        await self.db.commit()

    async def mark_queue_unavailable(
        self,
        job: CloneReplyJob,
        error_message: str,
    ) -> None:
        # Keep the job queued so a compensating dispatcher can retry it later.
        job.error_code = "queue_unavailable"
        job.error_message = error_message[:2000]
        await self.db.commit()

    async def _get_by_source(
        self, source_message_id: uuid.UUID
    ) -> CloneReplyJob | None:
        result = await self.db.execute(
            select(CloneReplyJob).where(
                CloneReplyJob.source_message_id == source_message_id
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    def _as_uuid(value: str | uuid.UUID) -> uuid.UUID:
        return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))

    @staticmethod
    def _as_utc(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
