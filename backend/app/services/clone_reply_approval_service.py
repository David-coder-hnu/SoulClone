from __future__ import annotations

import uuid
import hashlib
import hmac
from datetime import datetime, timezone

from sqlalchemy import or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.safety import AIRiskPolicy, SafetyAction
from app.core.realtime_events import publish_to_users
from app.models.clone import Clone
from app.models.clone_reply_job import CloneReplyJob
from app.models.conversation import Conversation
from app.models.message import Message
from app.services.chat_service import ChatService
from app.services.clone_reply_job_service import CloneReplyJobService
from app.services.conversation_control_service import ConversationControlService


class CloneReplyApprovalNotFound(Exception):
    pass


class CloneReplyApprovalConflict(Exception):
    pass


class CloneReplyApprovalService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.jobs = CloneReplyJobService(db)
        self.chat = ChatService(db)
        self.safety = AIRiskPolicy()

    async def list_pending(self, user_id: str | uuid.UUID) -> list[CloneReplyJob]:
        result = await self.db.execute(
            select(CloneReplyJob)
            .join(Clone, Clone.id == CloneReplyJob.clone_id)
            .where(
                Clone.user_id == self._as_uuid(user_id),
                CloneReplyJob.status == "awaiting_approval",
                CloneReplyJob.approval_status == "pending",
            )
            .order_by(CloneReplyJob.created_at.asc())
        )
        jobs = list(result.scalars().all())
        active_jobs = []
        for job in jobs:
            if self._is_expired(job):
                await self.jobs.expire_approval(job)
            else:
                active_jobs.append(job)
        return active_jobs

    async def approve(
        self,
        job_id: str | uuid.UUID,
        user_id: str | uuid.UUID,
    ) -> tuple[CloneReplyJob, Message]:
        job, clone, conversation = await self._require_owned_job(job_id, user_id)
        if job.status == "completed" and job.approval_status == "approved":
            message = await self.db.get(Message, job.reply_message_id)
            if message is None:
                raise CloneReplyApprovalConflict("Approved reply message is missing")
            return job, message
        if job.status != "awaiting_approval" or job.approval_status != "pending":
            raise CloneReplyApprovalConflict("Reply is not awaiting approval")
        if self._is_expired(job):
            await self.jobs.expire_approval(job)
            raise CloneReplyApprovalConflict("Reply approval has expired")
        if not job.draft_content:
            raise CloneReplyApprovalConflict("Reply draft is unavailable")
        current_hash = hashlib.sha256(job.draft_content.encode("utf-8")).hexdigest()
        if not job.content_hash or not hmac.compare_digest(
            current_hash, job.content_hash
        ):
            await self.jobs.invalidate_approval(job, "draft_integrity_failed")
            raise CloneReplyApprovalConflict("Reply draft integrity check failed")

        control = await ConversationControlService(self.db).snapshot(
            job.conversation_id, user_id
        )
        if control.mode == "blocked":
            raise CloneReplyApprovalConflict("Conversation is blocked")

        claim_result = await self.db.execute(
            update(CloneReplyJob)
            .where(
                CloneReplyJob.id == job.id,
                CloneReplyJob.status == "awaiting_approval",
                CloneReplyJob.approval_status == "pending",
            )
            .values(approval_status="approving")
        )
        if claim_result.rowcount != 1:
            await self.db.rollback()
            raise CloneReplyApprovalConflict("Reply review is already in progress")
        await self.db.commit()
        job.approval_status = "approving"

        reassessment = self.safety.assess(job.draft_content)
        if reassessment.action == SafetyAction.BLOCK:
            await self.jobs.record_safety(job, reassessment)
            await self.jobs.block_unsafe(job, job.draft_content)
            raise CloneReplyApprovalConflict("Reply is blocked by safety policy")

        try:
            message = await self.chat.send_message(
                conversation_id=job.conversation_id,
                sender_id=user_id,
                sender_type="clone",
                sender_clone_id=clone.id,
                client_message_id=job.id,
                content=job.draft_content,
            )
        except Exception:
            job.approval_status = "pending"
            await self.db.commit()
            raise
        clone.total_messages_sent = (clone.total_messages_sent or 0) + 1
        clone.last_activity_at = datetime.now(timezone.utc)
        await self.jobs.approve(job, user_id, message.id)

        participants = [
            str(conversation.participant_a_id),
            str(conversation.participant_b_id),
        ]
        await publish_to_users(
            {
                "type": "message",
                "conversation_id": str(job.conversation_id),
                "message": {
                    "id": str(message.id),
                    "sender_id": str(user_id),
                    "sender_type": "clone",
                    "content": message.content,
                    "created_at": message.created_at.isoformat(),
                },
            },
            participants,
        )
        await self._publish_review_status(job, str(user_id), "approved")
        return job, message

    async def reject(
        self,
        job_id: str | uuid.UUID,
        user_id: str | uuid.UUID,
    ) -> CloneReplyJob:
        job, _, _ = await self._require_owned_job(job_id, user_id)
        if job.status == "cancelled" and job.approval_status == "rejected":
            return job
        if job.status != "awaiting_approval" or job.approval_status != "pending":
            raise CloneReplyApprovalConflict("Reply is not awaiting approval")
        await self.jobs.reject(job, user_id)
        await self._publish_review_status(job, str(user_id), "rejected")
        return job

    async def _require_owned_job(
        self,
        job_id: str | uuid.UUID,
        user_id: str | uuid.UUID,
    ) -> tuple[CloneReplyJob, Clone, Conversation]:
        try:
            job_uuid = self._as_uuid(job_id)
            user_uuid = self._as_uuid(user_id)
        except (TypeError, ValueError):
            raise CloneReplyApprovalNotFound from None
        result = await self.db.execute(
            select(CloneReplyJob, Clone, Conversation)
            .join(Clone, Clone.id == CloneReplyJob.clone_id)
            .join(Conversation, Conversation.id == CloneReplyJob.conversation_id)
            .where(
                CloneReplyJob.id == job_uuid,
                Clone.user_id == user_uuid,
                or_(
                    Conversation.participant_a_id == user_uuid,
                    Conversation.participant_b_id == user_uuid,
                ),
            )
        )
        row = result.one_or_none()
        if row is None:
            raise CloneReplyApprovalNotFound
        return row

    async def _publish_review_status(
        self,
        job: CloneReplyJob,
        user_id: str,
        decision: str,
    ) -> None:
        await publish_to_users(
            {
                "type": "clone_reply_reviewed",
                "job_id": str(job.id),
                "conversation_id": str(job.conversation_id),
                "decision": decision,
                "status": job.status,
            },
            [user_id],
        )

    @staticmethod
    def _is_expired(job: CloneReplyJob) -> bool:
        expires_at = job.approval_expires_at
        if expires_at is None:
            return True
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        return expires_at <= datetime.now(timezone.utc)

    @staticmethod
    def _as_uuid(value: str | uuid.UUID) -> uuid.UUID:
        return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
