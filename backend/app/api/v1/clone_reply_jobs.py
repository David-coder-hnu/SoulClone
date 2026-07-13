import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user_id, get_db
from app.schemas.clone_reply_job import CloneReplyReviewRequest
from app.services.clone_reply_approval_service import (
    CloneReplyApprovalConflict,
    CloneReplyApprovalNotFound,
    CloneReplyApprovalService,
)


router = APIRouter()


def _job_payload(job) -> dict:
    return {
        "job_id": str(job.id),
        "conversation_id": str(job.conversation_id),
        "status": job.status,
        "risk_level": job.risk_level,
        "risk_categories": job.risk_categories or [],
        "risk_confidence": (
            float(job.risk_confidence) if job.risk_confidence is not None else None
        ),
        "draft_content": job.draft_content,
        "approval_status": job.approval_status,
        "approval_expires_at": (
            job.approval_expires_at.isoformat()
            if job.approval_expires_at
            else None
        ),
        "trace_id": str(job.trace_id),
    }


@router.get("/pending")
async def list_pending_clone_replies(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    jobs = await CloneReplyApprovalService(db).list_pending(user_id)
    return {"items": [_job_payload(job) for job in jobs]}


@router.post("/{job_id}/review")
async def review_clone_reply(
    job_id: str,
    request: CloneReplyReviewRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    service = CloneReplyApprovalService(db)
    try:
        if request.decision == "approve":
            job, message = await service.approve(job_id, user_id)
            return {**_job_payload(job), "message_id": str(message.id)}
        job = await service.reject(job_id, user_id)
        return _job_payload(job)
    except CloneReplyApprovalNotFound:
        raise HTTPException(status_code=404, detail="Reply review not found") from None
    except CloneReplyApprovalConflict as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from None
