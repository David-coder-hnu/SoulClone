from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from sqlalchemy import func, select

from app.ai.llm_client import LLMGatewayError
from app.ai.safety import AIRiskPolicy
from app.core.tasks import _run_clone_reply_job
from app.db.session import async_session
from app.models.clone import Clone
from app.models.clone_profile import CloneProfile
from app.models.clone_reply_job import CloneReplyJob
from app.models.conversation import Conversation
from app.models.message import Message
from app.services.chat_service import ChatService
from app.services.clone_reply_job_service import CloneReplyJobService
from app.services.conversation_control_service import ConversationControlService
from app.websocket.chat_handler import ChatHandler
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
    _, user_a = await _register(client, "13900139001", "Queue A")
    _, user_b = await _register(client, "13900139002", "Queue B")
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
        "user_a": user_a,
        "user_b": user_b,
        "conversation_id": str(conversation.id),
        "clone_id": str(clone.id),
    }


async def _create_source_and_job(context: dict[str, str]) -> str:
    async with async_session() as db:
        source = await ChatService(db).send_message(
            conversation_id=context["conversation_id"],
            sender_id=context["user_a"],
            sender_type="human",
            content="queued hello",
        )
        control = await ConversationControlService(db).snapshot(
            context["conversation_id"], context["user_b"]
        )
        job, created = await CloneReplyJobService(db).create_or_get(
            source_message_id=source.id,
            conversation_id=context["conversation_id"],
            clone_id=context["clone_id"],
            control_version=control.version,
        )
        assert created is True
        return str(job.id)


@pytest.mark.asyncio
async def test_websocket_persists_one_job_and_dispatches_once(client, monkeypatch):
    context = await _create_context(client)
    dispatch = Mock()
    send_to_users = AsyncMock()
    send_personal_message = AsyncMock()
    monkeypatch.setattr(
        "app.websocket.chat_handler.dispatch_clone_reply_job", dispatch
    )
    monkeypatch.setattr(
        "app.websocket.chat_handler.manager.send_to_users", send_to_users
    )
    monkeypatch.setattr(
        "app.websocket.chat_handler.manager.send_personal_message",
        send_personal_message,
    )
    client_message_id = str(uuid.uuid4())
    event = {
        "type": "message",
        "conversation_id": context["conversation_id"],
        "client_message_id": client_message_id,
        "content": "return the ACK before generating",
    }

    async with async_session() as db:
        handler = ChatHandler(db)
        await handler.handle_message(context["user_a"], event)
        await handler.handle_message(context["user_a"], event)
        jobs = (await db.execute(select(CloneReplyJob))).scalars().all()

    assert len(jobs) == 1
    assert jobs[0].status == "queued"
    dispatch.assert_called_once_with(str(jobs[0].id))
    assert send_personal_message.await_count == 2
    status_events = [
        call.args[0]
        for call in send_to_users.await_args_list
        if call.args[0]["type"] == "clone_reply_status"
    ]
    assert len(status_events) == 1
    assert status_events[0]["status"] == "queued"


@pytest.mark.asyncio
async def test_clone_reply_job_completes_once_across_duplicate_delivery(
    client,
    monkeypatch,
):
    context = await _create_context(client)
    job_id = await _create_source_and_job(context)
    publish_to_users = AsyncMock()
    monkeypatch.setattr(
        "app.core.realtime_events.publish_to_users", publish_to_users
    )

    async def fake_generate(
        bridge,
        *,
        clone_id,
        user_id,
        conversation_id,
        incoming_message,
        other_user_id,
        control_version_at_start,
        status_callback,
        client_message_id,
        trace_id,
        safety_callback,
    ):
        assert incoming_message == "queued hello"
        assert client_message_id == uuid.UUID(job_id)
        assert trace_id is not None
        await safety_callback(AIRiskPolicy().assess("background reply"))
        for status in (
            "context_loading",
            "generating",
            "validating",
            "delivering",
        ):
            await status_callback(status)
        return await bridge.chat_service.send_message(
            conversation_id=conversation_id,
            sender_id=user_id,
            sender_type="clone",
            sender_clone_id=clone_id,
            client_message_id=client_message_id,
            content="background reply",
        )

    monkeypatch.setattr(
        CloneBridge,
        "generate_and_send_clone_reply",
        fake_generate,
    )

    await _run_clone_reply_job(job_id)
    await _run_clone_reply_job(job_id)

    async with async_session() as db:
        job = await db.get(CloneReplyJob, uuid.UUID(job_id))
        message_count = await db.scalar(select(func.count(Message.id)))

    assert job is not None
    assert job.status == "completed"
    assert job.attempt_count == 1
    assert job.reply_message_id is not None
    assert message_count == 2
    statuses = [call.args[0]["status"] for call in publish_to_users.await_args_list]
    assert statuses == [
        "planning",
        "context_loading",
        "generating",
        "validating",
        "delivering",
        "completed",
    ]


@pytest.mark.asyncio
async def test_queued_job_is_cancelled_when_control_version_changes(
    client,
    monkeypatch,
):
    context = await _create_context(client)
    job_id = await _create_source_and_job(context)
    generate = AsyncMock()
    publish_to_users = AsyncMock()
    monkeypatch.setattr(CloneBridge, "generate_and_send_clone_reply", generate)
    monkeypatch.setattr(
        "app.core.realtime_events.publish_to_users", publish_to_users
    )

    async with async_session() as db:
        await ConversationControlService(db).transition(
            context["conversation_id"],
            context["user_b"],
            "takeover",
            reason="cancel_queued_job_test",
        )

    await _run_clone_reply_job(job_id)

    async with async_session() as db:
        job = await db.get(CloneReplyJob, uuid.UUID(job_id))
        message_count = await db.scalar(select(func.count(Message.id)))

    assert job is not None
    assert job.status == "cancelled"
    assert job.cancel_reason == "control_changed_before_execution"
    assert message_count == 1
    generate.assert_not_awaited()
    assert publish_to_users.await_args.args[0]["status"] == "cancelled"


@pytest.mark.asyncio
async def test_redelivered_worker_recovers_reply_committed_before_job_completion(
    client,
    monkeypatch,
):
    context = await _create_context(client)
    job_id = await _create_source_and_job(context)
    generate = AsyncMock()
    publish_to_users = AsyncMock()
    monkeypatch.setattr(CloneBridge, "generate_and_send_clone_reply", generate)
    monkeypatch.setattr(
        "app.core.realtime_events.publish_to_users", publish_to_users
    )

    async with async_session() as db:
        job = await db.get(CloneReplyJob, uuid.UUID(job_id))
        await ChatService(db).send_message(
            conversation_id=context["conversation_id"],
            sender_id=context["user_b"],
            sender_type="clone",
            sender_clone_id=context["clone_id"],
            client_message_id=job.id,
            content="already committed reply",
        )
        job.status = "delivering"
        job.worker_task_id = "celery-task-1"
        job.lease_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        await db.commit()

    # A duplicate delivery with another task ID respects the active lease.
    await _run_clone_reply_job(job_id, worker_task_id="celery-task-2")
    async with async_session() as db:
        leased_job = await db.get(CloneReplyJob, uuid.UUID(job_id))
        assert leased_job.status == "delivering"

    # Celery redelivers a worker-lost task with the original task ID.
    await _run_clone_reply_job(job_id, worker_task_id="celery-task-1")

    async with async_session() as db:
        recovered_job = await db.get(CloneReplyJob, uuid.UUID(job_id))
        message_count = await db.scalar(select(func.count(Message.id)))

    assert recovered_job.status == "completed"
    assert recovered_job.reply_message_id is not None
    assert recovered_job.attempt_count == 1
    assert message_count == 2
    generate.assert_not_awaited()
    message_events = [
        call.args[0]
        for call in publish_to_users.await_args_list
        if call.args[0]["type"] == "message"
    ]
    assert len(message_events) == 1
    assert message_events[0]["message"]["content"] == "already committed reply"


@pytest.mark.asyncio
async def test_generation_failure_is_persisted_for_retry(client, monkeypatch):
    context = await _create_context(client)
    job_id = await _create_source_and_job(context)
    monkeypatch.setattr(
        CloneBridge,
        "generate_and_send_clone_reply",
        AsyncMock(side_effect=RuntimeError("provider timeout")),
    )
    monkeypatch.setattr(
        "app.core.realtime_events.publish_to_users",
        AsyncMock(),
    )

    with pytest.raises(RuntimeError, match="provider timeout"):
        await _run_clone_reply_job(job_id)

    async with async_session() as db:
        job = await db.get(CloneReplyJob, uuid.UUID(job_id))

    assert job.status == "failed"
    assert job.attempt_count == 1
    assert job.error_code == "generation_failed"
    assert job.error_message == "provider timeout"
    assert job.lease_expires_at is None


@pytest.mark.asyncio
async def test_gateway_error_code_is_preserved_on_reply_job(client, monkeypatch):
    context = await _create_context(client)
    job_id = await _create_source_and_job(context)
    gateway_error = LLMGatewayError(
        "all providers timed out",
        code="timeout",
        trace_id=uuid.uuid4(),
        attempt_count=4,
    )
    monkeypatch.setattr(
        CloneBridge,
        "generate_and_send_clone_reply",
        AsyncMock(side_effect=gateway_error),
    )
    monkeypatch.setattr(
        "app.core.realtime_events.publish_to_users",
        AsyncMock(),
    )

    with pytest.raises(LLMGatewayError):
        await _run_clone_reply_job(job_id)

    async with async_session() as db:
        job = await db.get(CloneReplyJob, uuid.UUID(job_id))

    assert job.status == "failed"
    assert job.error_code == "timeout"
    assert job.error_message == "all providers timed out"


@pytest.mark.asyncio
async def test_exhausted_worker_retries_move_job_to_dead_letter(client, monkeypatch):
    context = await _create_context(client)
    job_id = await _create_source_and_job(context)
    monkeypatch.setattr(
        CloneBridge,
        "generate_and_send_clone_reply",
        AsyncMock(side_effect=RuntimeError("permanent pipeline failure")),
    )
    monkeypatch.setattr(
        "app.core.realtime_events.publish_to_users",
        AsyncMock(),
    )
    celery_self = SimpleNamespace(
        request=SimpleNamespace(retries=2),
        max_retries=2,
    )

    with pytest.raises(RuntimeError, match="permanent pipeline failure"):
        await _run_clone_reply_job(job_id, celery_self=celery_self)

    async with async_session() as db:
        job = await db.get(CloneReplyJob, uuid.UUID(job_id))

    assert job.status == "dead_lettered"
    assert job.error_code == "generation_failed"
    assert job.completed_at is not None
    assert job.lease_expires_at is None
