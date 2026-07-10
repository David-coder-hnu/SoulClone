from __future__ import annotations

import uuid
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import func, select

from app.db.session import async_session
from app.models.conversation import Conversation
from app.models.message import Message
from app.websocket.chat_handler import ChatHandler


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
