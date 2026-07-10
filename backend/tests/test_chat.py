from __future__ import annotations

import asyncio
import uuid
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import func, select

from app.db.session import async_session
from app.models.conversation import Conversation
from app.models.clone import Clone
from app.models.clone_profile import CloneProfile
from app.models.conversation_control import ConversationControl
from app.models.message import Message
from app.models.takeover import Takeover
from app.services.conversation_control_service import ConversationControlService
from app.websocket.chat_handler import ChatHandler
from app.websocket.clone_bridge import CloneBridge


async def _register_user(client, phone: str, nickname: str) -> tuple[str, str]:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": phone,
            "password": "password123",
            "nickname": nickname,
        },
    )
    assert response.status_code == 200
    token = response.json()["access_token"]

    me_response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    return token, me_response.json()["id"]


async def _create_three_users_and_conversation(client):
    token_a, user_a = await _register_user(client, "13800138001", "User A")
    token_b, user_b = await _register_user(client, "13800138002", "User B")
    token_c, user_c = await _register_user(client, "13800138003", "User C")

    async with async_session() as db:
        conversation = Conversation(
            participant_a_id=uuid.UUID(user_a),
            participant_b_id=uuid.UUID(user_b),
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        conversation_id = str(conversation.id)

    return {
        "token_a": token_a,
        "token_b": token_b,
        "token_c": token_c,
        "user_a": user_a,
        "user_b": user_b,
        "user_c": user_c,
        "conversation_id": conversation_id,
    }


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_conversation_list_requires_authentication(client):
    response = await client.get("/api/v1/conversations/")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_members_can_read_and_send_messages(client):
    context = await _create_three_users_and_conversation(client)
    conversation_id = context["conversation_id"]

    send_response = await client.post(
        f"/api/v1/messages/{conversation_id}",
        headers=_auth(context["token_a"]),
        json={"content": "  hello from A  "},
    )
    assert send_response.status_code == 200
    assert send_response.json()["content"] == "hello from A"

    read_response = await client.get(
        f"/api/v1/messages/{conversation_id}",
        headers=_auth(context["token_b"]),
    )
    assert read_response.status_code == 200
    assert [item["content"] for item in read_response.json()["items"]] == [
        "hello from A"
    ]


@pytest.mark.asyncio
async def test_non_member_cannot_read_send_or_take_over(client):
    context = await _create_three_users_and_conversation(client)
    conversation_id = context["conversation_id"]
    headers = _auth(context["token_c"])

    read_response = await client.get(
        f"/api/v1/messages/{conversation_id}", headers=headers
    )
    send_response = await client.post(
        f"/api/v1/messages/{conversation_id}",
        headers=headers,
        json={"content": "unauthorized"},
    )
    takeover_response = await client.post(
        f"/api/v1/conversations/{conversation_id}/takeover",
        headers=headers,
    )

    assert read_response.status_code == 404
    assert send_response.status_code == 404
    assert takeover_response.status_code == 404
    assert read_response.json() == {"detail": "Conversation not found"}

    async with async_session() as db:
        message_count = await db.scalar(select(func.count(Message.id)))
    assert message_count == 0


@pytest.mark.asyncio
async def test_control_state_transitions_are_versioned_and_idempotent(client):
    context = await _create_three_users_and_conversation(client)
    conversation_id = context["conversation_id"]
    headers = _auth(context["token_b"])

    initial = await client.get(
        f"/api/v1/conversations/{conversation_id}/control",
        headers=headers,
    )
    takeover = await client.post(
        f"/api/v1/conversations/{conversation_id}/takeover",
        headers=headers,
    )
    repeated_takeover = await client.post(
        f"/api/v1/conversations/{conversation_id}/takeover",
        headers=headers,
    )
    release = await client.post(
        f"/api/v1/conversations/{conversation_id}/release",
        headers=headers,
    )

    assert initial.status_code == takeover.status_code == 200
    assert repeated_takeover.status_code == release.status_code == 200
    assert initial.json()["mode"] == "clone_active"
    assert initial.json()["version"] == 1
    assert takeover.json()["mode"] == "human_active"
    assert takeover.json()["version"] == 2
    assert repeated_takeover.json()["version"] == 2
    assert release.json()["mode"] == "clone_cooldown"
    assert release.json()["version"] == 3
    assert release.json()["expires_at"] is not None

    async with async_session() as db:
        takeover_count = await db.scalar(select(func.count(Takeover.id)))
        active_takeover_count = await db.scalar(
            select(func.count(Takeover.id)).where(Takeover.ended_at.is_(None))
        )
        control_count = await db.scalar(
            select(func.count(ConversationControl.id))
        )

    assert takeover_count == 1
    assert active_takeover_count == 0
    assert control_count == 1


@pytest.mark.asyncio
async def test_websocket_control_event_uses_authoritative_state(client, monkeypatch):
    context = await _create_three_users_and_conversation(client)
    send_to_users = AsyncMock()
    monkeypatch.setattr(
        "app.websocket.chat_handler.manager.send_to_users",
        send_to_users,
    )

    async with async_session() as db:
        handler = ChatHandler(db)
        await handler.handle_message(
            context["user_b"],
            {
                "type": "control",
                "conversation_id": context["conversation_id"],
                "action": "takeover",
            },
        )
        control = await ConversationControlService(db).snapshot(
            context["conversation_id"], context["user_b"]
        )

    assert control.mode == "human_active"
    payload, recipients = send_to_users.await_args.args
    assert payload["type"] == "control_changed"
    assert payload["mode"] == "human_active"
    assert payload["version"] == 2
    assert set(recipients) == {context["user_a"], context["user_b"]}


@pytest.mark.asyncio
async def test_takeover_cancels_clone_reply_that_is_already_generating(
    client,
    monkeypatch,
):
    context = await _create_three_users_and_conversation(client)
    conversation_id = context["conversation_id"]
    clone_owner_id = context["user_b"]
    generation_started = asyncio.Event()
    finish_generation = asyncio.Event()
    publish_to_users = AsyncMock()
    monkeypatch.setattr(
        "app.websocket.clone_bridge.publish_to_users",
        publish_to_users,
    )
    monkeypatch.setattr(
        "app.websocket.clone_bridge.asyncio.sleep",
        AsyncMock(),
    )

    async with async_session() as db:
        profile = CloneProfile(
            user_id=uuid.UUID(clone_owner_id),
            distilled_persona={},
            chat_dna={},
            system_prompt="Reply naturally",
        )
        db.add(profile)
        await db.flush()
        clone = Clone(
            user_id=uuid.UUID(clone_owner_id),
            profile_id=profile.id,
            status="active",
        )
        db.add(clone)
        await db.commit()
        await db.refresh(clone)

        bridge = CloneBridge(db)
        bridge.initialize_clone = AsyncMock(return_value=True)
        bridge.emotion.update_from_message = AsyncMock()
        bridge.emotion.get_mood_context = AsyncMock(
            return_value={"mood": "calm", "intensity": 0.5}
        )
        bridge.memory.add_interaction = AsyncMock()
        bridge.memory.get_conversation_history = AsyncMock(return_value=[])
        bridge.memory.get_memory_context = AsyncMock(return_value={})
        bridge._build_relationship_context = AsyncMock(return_value={})
        bridge._update_intimacy = AsyncMock()

        async def generate_reply(**_kwargs):
            generation_started.set()
            await finish_generation.wait()
            return "This reply must be cancelled"

        bridge.generator.generate = AsyncMock(side_effect=generate_reply)
        reply_task = asyncio.create_task(
            bridge.generate_and_send_clone_reply(
                clone_id=str(clone.id),
                user_id=clone_owner_id,
                conversation_id=conversation_id,
                incoming_message="Are you there?",
                other_user_id=context["user_a"],
            )
        )

        await generation_started.wait()
        async with async_session() as takeover_db:
            snapshot = await ConversationControlService(takeover_db).transition(
                conversation_id,
                clone_owner_id,
                "takeover",
                reason="race_test",
            )
        assert snapshot.mode == "human_active"

        finish_generation.set()
        reply = await reply_task
        message_count = await db.scalar(select(func.count(Message.id)))

    assert reply is None
    assert message_count == 0
    publish_to_users.assert_not_awaited()


@pytest.mark.asyncio
async def test_missing_and_forbidden_conversations_have_same_response(client):
    context = await _create_three_users_and_conversation(client)
    headers = _auth(context["token_c"])

    forbidden_response = await client.get(
        f"/api/v1/messages/{context['conversation_id']}", headers=headers
    )
    missing_response = await client.get(
        "/api/v1/messages/00000000-0000-0000-0000-000000000000",
        headers=headers,
    )

    assert forbidden_response.status_code == missing_response.status_code == 404
    assert forbidden_response.json() == missing_response.json()


@pytest.mark.asyncio
async def test_blank_message_is_rejected(client):
    context = await _create_three_users_and_conversation(client)

    response = await client.post(
        f"/api/v1/messages/{context['conversation_id']}",
        headers=_auth(context["token_a"]),
        json={"content": "   "},
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_websocket_handler_rejects_non_member_before_writing(
    client,
    monkeypatch,
):
    context = await _create_three_users_and_conversation(client)
    send_personal_message = AsyncMock()
    monkeypatch.setattr(
        "app.websocket.chat_handler.manager.send_personal_message",
        send_personal_message,
    )

    async with async_session() as db:
        handler = ChatHandler(db)
        await handler.handle_message(
            context["user_c"],
            {
                "type": "message",
                "conversation_id": context["conversation_id"],
                "client_message_id": str(uuid.uuid4()),
                "content": "unauthorized websocket message",
            },
        )
        message_count = await db.scalar(select(func.count(Message.id)))

    assert message_count == 0
    send_personal_message.assert_awaited_once_with(
        {
            "type": "error",
            "code": "CONVERSATION_NOT_FOUND",
            "message": "Conversation not found",
        },
        context["user_c"],
    )


@pytest.mark.asyncio
async def test_websocket_message_is_idempotent_and_acknowledged(
    client,
    monkeypatch,
):
    context = await _create_three_users_and_conversation(client)
    send_personal_message = AsyncMock()
    send_to_users = AsyncMock()
    monkeypatch.setattr(
        "app.websocket.chat_handler.manager.send_personal_message",
        send_personal_message,
    )
    monkeypatch.setattr(
        "app.websocket.chat_handler.manager.send_to_users",
        send_to_users,
    )
    client_message_id = str(uuid.uuid4())
    event = {
        "type": "message",
        "conversation_id": context["conversation_id"],
        "client_message_id": client_message_id,
        "content": "send exactly once",
    }

    async with async_session() as db:
        handler = ChatHandler(db)
        await handler.handle_message(context["user_a"], event)
        await handler.handle_message(context["user_a"], event)
        message_count = await db.scalar(select(func.count(Message.id)))

    assert message_count == 1
    assert send_to_users.await_count == 1
    assert send_personal_message.await_count == 2
    first_ack = send_personal_message.await_args_list[0].args[0]
    second_ack = send_personal_message.await_args_list[1].args[0]
    assert first_ack["type"] == second_ack["type"] == "ack"
    assert first_ack["client_message_id"] == client_message_id
    assert first_ack["duplicate"] is False
    assert second_ack["duplicate"] is True


@pytest.mark.asyncio
async def test_read_receipt_marks_incoming_messages_and_is_idempotent(
    client,
    monkeypatch,
):
    context = await _create_three_users_and_conversation(client)
    conversation_id = context["conversation_id"]
    first = await client.post(
        f"/api/v1/messages/{conversation_id}",
        headers=_auth(context["token_a"]),
        json={"content": "first unread"},
    )
    second = await client.post(
        f"/api/v1/messages/{conversation_id}",
        headers=_auth(context["token_a"]),
        json={"content": "second unread"},
    )
    assert first.status_code == second.status_code == 200

    send_to_users = AsyncMock()
    monkeypatch.setattr(
        "app.websocket.chat_handler.manager.send_to_users",
        send_to_users,
    )
    receipt = {
        "type": "read_receipt",
        "conversation_id": conversation_id,
        "message_id": second.json()["id"],
    }

    async with async_session() as db:
        handler = ChatHandler(db)
        await handler.handle_message(context["user_b"], receipt)
        await handler.handle_message(context["user_b"], receipt)
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == uuid.UUID(conversation_id))
            .order_by(Message.created_at.asc())
        )
        messages = result.scalars().all()

    assert len(messages) == 2
    assert all(message.is_read for message in messages)
    assert all(message.read_at is not None for message in messages)
    assert all(message.delivery_status == "read" for message in messages)
    assert send_to_users.await_count == 2
    first_receipt = send_to_users.await_args_list[0].args[0]
    repeated_receipt = send_to_users.await_args_list[1].args[0]
    assert first_receipt["type"] == "read_receipt"
    assert set(first_receipt["message_ids"]) == {
        first.json()["id"],
        second.json()["id"],
    }
    assert repeated_receipt["message_ids"] == []


@pytest.mark.asyncio
async def test_websocket_ping_returns_pong(client, monkeypatch):
    send_personal_message = AsyncMock()
    monkeypatch.setattr(
        "app.websocket.chat_handler.manager.send_personal_message",
        send_personal_message,
    )

    async with async_session() as db:
        handler = ChatHandler(db)
        await handler.handle_message(
            str(uuid.uuid4()),
            {
                "type": "ping",
                "client_time": "2026-07-10T00:00:00Z",
            },
        )

    payload = send_personal_message.await_args.args[0]
    assert payload["type"] == "pong"
    assert payload["client_time"] == "2026-07-10T00:00:00Z"
    assert "server_time" in payload
