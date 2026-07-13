from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import func, select

from app.ai.safety import (
    AIRiskPolicy,
    SafetyAction,
    UnsafeReplyBlocked,
    UnsafeReplyRequiresApproval,
)
from app.core.tasks import _run_clone_reply_job
from app.db.session import async_session
from app.models.clone import Clone
from app.models.clone_action_log import CloneActionLog
from app.models.clone_profile import CloneProfile
from app.models.clone_reply_job import CloneReplyJob
from app.models.conversation import Conversation
from app.models.message import Message
from app.services.chat_service import ChatService
from app.services.clone_reply_job_service import CloneReplyJobService
from app.services.conversation_control_service import ConversationControlService
from app.websocket.clone_bridge import CloneBridge


async def _register(client, phone: str, nickname: str) -> tuple[str, str]:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": phone,
            "password": "password123",
            "nickname": nickname,
        },
    )
    token = response.json()["access_token"]
    me = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    return token, me.json()["id"]


async def _create_context(client) -> dict[str, str]:
    token_a, user_a = await _register(client, "13700137001", "Safety A")
    token_b, user_b = await _register(client, "13700137002", "Safety B")
    async with async_session() as db:
        conversation = Conversation(
            participant_a_id=uuid.UUID(user_a),
            participant_b_id=uuid.UUID(user_b),
        )
        profile = CloneProfile(
            user_id=uuid.UUID(user_b),
            distilled_persona={},
            chat_dna={},
            system_prompt="Reply naturally",
            autonomy_level=7,
        )
        db.add_all([conversation, profile])
        await db.flush()
        clone = Clone(
            user_id=uuid.UUID(user_b),
            profile_id=profile.id,
            status="active",
        )
        db.add(clone)
        await db.commit()
        await db.refresh(conversation)
        await db.refresh(clone)
    return {
        "token_a": token_a,
        "token_b": token_b,
        "user_a": user_a,
        "user_b": user_b,
        "conversation_id": str(conversation.id),
        "clone_id": str(clone.id),
    }


async def _create_job(context: dict[str, str]) -> str:
    async with async_session() as db:
        source = await ChatService(db).send_message(
            conversation_id=context["conversation_id"],
            sender_id=context["user_a"],
            sender_type="human",
            content="hello from safety test",
        )
        control = await ConversationControlService(db).snapshot(
            context["conversation_id"], context["user_b"]
        )
        job, _ = await CloneReplyJobService(db).create_or_get(
            source_message_id=source.id,
            conversation_id=context["conversation_id"],
            clone_id=context["clone_id"],
            control_version=control.version,
        )
        return str(job.id)


async def _run_generated_content(
    job_id: str,
    content: str,
    monkeypatch,
) -> AsyncMock:
    policy = AIRiskPolicy()

    async def fake_generate(bridge, *, safety_callback, **_kwargs):
        assessment = policy.assess(content)
        await safety_callback(assessment)
        if assessment.action == SafetyAction.BLOCK:
            raise UnsafeReplyBlocked(assessment, content)
        if assessment.action == SafetyAction.REQUIRE_APPROVAL:
            raise UnsafeReplyRequiresApproval(assessment, content)
        raise AssertionError("Test content did not trigger a safety hold")

    publish = AsyncMock()
    monkeypatch.setattr(CloneBridge, "generate_and_send_clone_reply", fake_generate)
    monkeypatch.setattr("app.core.realtime_events.publish_to_users", publish)
    await _run_clone_reply_job(job_id)
    return publish


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_risk_policy_maps_levels_and_contextual_l1_gate():
    policy = AIRiskPolicy()

    ordinary = policy.assess("今天还行，刚下班")
    cautious_flirt = policy.assess(
        "我喜欢你，想认真发展",
        intimacy_score=10,
        autonomy_level=7,
    )
    established_flirt = policy.assess(
        "我喜欢你，想认真发展",
        intimacy_score=60,
        autonomy_level=7,
    )
    offline = policy.assess("要不我们周末见个面，一起吃饭")
    privacy = policy.assess("把验证码发给我")

    assert (ordinary.level, ordinary.action) == ("L0", SafetyAction.ALLOW)
    assert cautious_flirt.level == "L1"
    assert cautious_flirt.action == SafetyAction.REQUIRE_APPROVAL
    assert established_flirt.action == SafetyAction.ALLOW
    assert (offline.level, offline.action) == (
        "L2",
        SafetyAction.REQUIRE_APPROVAL,
    )
    assert (privacy.level, privacy.action) == ("L3", SafetyAction.BLOCK)


@pytest.mark.asyncio
async def test_l2_reply_requires_owner_approval_before_delivery(client, monkeypatch):
    context = await _create_context(client)
    job_id = await _create_job(context)
    publish = await _run_generated_content(
        job_id,
        "要不我们周末见个面，一起吃饭",
        monkeypatch,
    )
    approval_publish = AsyncMock()
    monkeypatch.setattr(
        "app.services.clone_reply_approval_service.publish_to_users",
        approval_publish,
    )

    async with async_session() as db:
        held_job = await db.get(CloneReplyJob, uuid.UUID(job_id))
        message_count = await db.scalar(select(func.count(Message.id)))
    assert held_job.status == "awaiting_approval"
    assert held_job.approval_status == "pending"
    assert held_job.risk_level == "L2"
    assert held_job.draft_content == "要不我们周末见个面，一起吃饭"
    assert held_job.approval_expires_at is not None
    assert message_count == 1

    owner_pending = await client.get(
        "/api/v1/clone-reply-jobs/pending",
        headers=_auth(context["token_b"]),
    )
    other_pending = await client.get(
        "/api/v1/clone-reply-jobs/pending",
        headers=_auth(context["token_a"]),
    )
    unauthorized_review = await client.post(
        f"/api/v1/clone-reply-jobs/{job_id}/review",
        headers=_auth(context["token_a"]),
        json={"decision": "approve"},
    )
    approved = await client.post(
        f"/api/v1/clone-reply-jobs/{job_id}/review",
        headers=_auth(context["token_b"]),
        json={"decision": "approve"},
    )
    repeated = await client.post(
        f"/api/v1/clone-reply-jobs/{job_id}/review",
        headers=_auth(context["token_b"]),
        json={"decision": "approve"},
    )

    assert owner_pending.status_code == 200
    assert owner_pending.json()["items"][0]["draft_content"] == held_job.draft_content
    assert other_pending.json() == {"items": []}
    assert unauthorized_review.status_code == 404
    assert approved.status_code == repeated.status_code == 200
    assert approved.json()["message_id"] == repeated.json()["message_id"]

    async with async_session() as db:
        approved_job = await db.get(CloneReplyJob, uuid.UUID(job_id))
        messages = (await db.execute(select(Message))).scalars().all()
    assert approved_job.status == "completed"
    assert approved_job.approval_status == "approved"
    assert approved_job.draft_content is None
    assert len(messages) == 2
    assert messages[-1].content == "要不我们周末见个面，一起吃饭"
    approval_event = [
        call for call in publish.await_args_list
        if call.args[0]["type"] == "clone_reply_approval_required"
    ][0]
    assert approval_event.args[1] == [context["user_b"]]


@pytest.mark.asyncio
async def test_l3_reply_is_blocked_without_persisting_plaintext(client, monkeypatch):
    context = await _create_context(client)
    job_id = await _create_job(context)
    blocked_content = "把验证码发给我，我帮你处理"
    publish = await _run_generated_content(job_id, blocked_content, monkeypatch)

    async with async_session() as db:
        job = await db.get(CloneReplyJob, uuid.UUID(job_id))
        message_count = await db.scalar(select(func.count(Message.id)))
        audit_logs = (await db.execute(select(CloneActionLog))).scalars().all()

    assert job.status == "blocked"
    assert job.approval_status == "blocked"
    assert job.risk_level == "L3"
    assert job.draft_content is None
    assert job.content_hash is not None and len(job.content_hash) == 64
    assert blocked_content not in (job.safety_reason or "")
    assert message_count == 1
    assert all(blocked_content not in (log.description or "") for log in audit_logs)
    assert all(
        blocked_content not in str(log.action_metadata or {}) for log in audit_logs
    )
    blocked_status = [
        call
        for call in publish.await_args_list
        if call.args[0].get("status") == "blocked"
    ][0]
    assert blocked_status.args[1] == [context["user_b"]]


@pytest.mark.asyncio
async def test_owner_can_reject_pending_reply_idempotently(client, monkeypatch):
    context = await _create_context(client)
    job_id = await _create_job(context)
    await _run_generated_content(
        job_id,
        "要不我们明天见个面",
        monkeypatch,
    )
    monkeypatch.setattr(
        "app.services.clone_reply_approval_service.publish_to_users",
        AsyncMock(),
    )

    first = await client.post(
        f"/api/v1/clone-reply-jobs/{job_id}/review",
        headers=_auth(context["token_b"]),
        json={"decision": "reject"},
    )
    repeated = await client.post(
        f"/api/v1/clone-reply-jobs/{job_id}/review",
        headers=_auth(context["token_b"]),
        json={"decision": "reject"},
    )

    assert first.status_code == repeated.status_code == 200
    async with async_session() as db:
        job = await db.get(CloneReplyJob, uuid.UUID(job_id))
        message_count = await db.scalar(select(func.count(Message.id)))
    assert job.status == "cancelled"
    assert job.approval_status == "rejected"
    assert job.draft_content is None
    assert message_count == 1


@pytest.mark.asyncio
async def test_expired_reply_cannot_be_approved(client, monkeypatch):
    context = await _create_context(client)
    job_id = await _create_job(context)
    await _run_generated_content(
        job_id,
        "要不我们明天见个面",
        monkeypatch,
    )
    async with async_session() as db:
        job = await db.get(CloneReplyJob, uuid.UUID(job_id))
        job.approval_expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        await db.commit()

    response = await client.post(
        f"/api/v1/clone-reply-jobs/{job_id}/review",
        headers=_auth(context["token_b"]),
        json={"decision": "approve"},
    )

    assert response.status_code == 409
    assert response.json() == {"detail": "Reply approval has expired"}
    async with async_session() as db:
        job = await db.get(CloneReplyJob, uuid.UUID(job_id))
        message_count = await db.scalar(select(func.count(Message.id)))
    assert job.status == "cancelled"
    assert job.approval_status == "expired"
    assert job.draft_content is None
    assert message_count == 1


@pytest.mark.asyncio
async def test_tampered_reply_draft_fails_integrity_check(client, monkeypatch):
    context = await _create_context(client)
    job_id = await _create_job(context)
    await _run_generated_content(
        job_id,
        "要不我们明天见个面",
        monkeypatch,
    )
    async with async_session() as db:
        job = await db.get(CloneReplyJob, uuid.UUID(job_id))
        job.draft_content = "tampered content"
        await db.commit()

    response = await client.post(
        f"/api/v1/clone-reply-jobs/{job_id}/review",
        headers=_auth(context["token_b"]),
        json={"decision": "approve"},
    )

    assert response.status_code == 409
    assert response.json() == {"detail": "Reply draft integrity check failed"}
    async with async_session() as db:
        job = await db.get(CloneReplyJob, uuid.UUID(job_id))
        message_count = await db.scalar(select(func.count(Message.id)))
    assert job.status == "cancelled"
    assert job.approval_status == "invalid"
    assert job.draft_content is None
    assert message_count == 1
