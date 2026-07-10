from __future__ import annotations

import uuid

import pytest

from app.db.session import async_session
from app.models.clone import Clone
from app.models.conversation import Conversation
from app.models.date_invite import DateInvite
from app.models.match import Match
from app.models.notification import Notification


async def _register(client, phone: str, nickname: str) -> tuple[str, uuid.UUID]:
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
    return token, uuid.UUID(me.json()["id"])


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_user_cannot_mark_another_users_notification_read(client):
    token_a, user_a = await _register(client, "13900138001", "Owner")
    token_b, _ = await _register(client, "13900138002", "Attacker")

    async with async_session() as db:
        notification = Notification(
            user_id=user_a,
            type="system",
            title="Private notification",
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        notification_id = str(notification.id)

    forbidden = await client.post(
        f"/api/v1/notifications/{notification_id}/read",
        headers=_auth(token_b),
    )
    assert forbidden.status_code == 404

    allowed = await client.post(
        f"/api/v1/notifications/{notification_id}/read",
        headers=_auth(token_a),
    )
    assert allowed.status_code == 200


@pytest.mark.asyncio
async def test_only_invitee_can_respond_to_pending_date_invite(client):
    token_a, user_a = await _register(client, "13900138003", "Proposer")
    token_b, user_b = await _register(client, "13900138004", "Invitee")
    token_c, _ = await _register(client, "13900138005", "Attacker")

    async with async_session() as db:
        proposer_clone = Clone(user_id=user_a, name="Proposer Clone")
        db.add(proposer_clone)
        conversation = Conversation(
            participant_a_id=user_a,
            participant_b_id=user_b,
        )
        db.add(conversation)
        await db.flush()
        invite = DateInvite(
            conversation_id=conversation.id,
            proposer_clone_id=proposer_clone.id,
            proposer_user_id=user_a,
            invitee_user_id=user_b,
            status="pending",
        )
        db.add(invite)
        await db.commit()
        await db.refresh(invite)
        invite_id = str(invite.id)

    attacker_response = await client.post(
        f"/api/v1/date-invites/{invite_id}/respond?decision=accepted",
        headers=_auth(token_c),
    )
    proposer_response = await client.post(
        f"/api/v1/date-invites/{invite_id}/respond?decision=accepted",
        headers=_auth(token_a),
    )
    invitee_response = await client.post(
        f"/api/v1/date-invites/{invite_id}/respond?decision=accepted",
        headers=_auth(token_b),
    )

    assert attacker_response.status_code == 404
    assert proposer_response.status_code == 404
    assert invitee_response.status_code == 200


@pytest.mark.asyncio
async def test_only_match_participants_can_change_match_status(client):
    token_a, user_a = await _register(client, "13900138006", "Match A")
    token_b, user_b = await _register(client, "13900138007", "Match B")
    token_c, _ = await _register(client, "13900138008", "Attacker")

    async with async_session() as db:
        match = Match(
            user_a_id=user_a,
            user_b_id=user_b,
            compatibility_score=88,
            initiated_by="human_a",
            status="pending",
        )
        db.add(match)
        await db.commit()
        await db.refresh(match)
        match_id = str(match.id)

    forbidden = await client.post(
        f"/api/v1/matches/{match_id}/action",
        headers=_auth(token_c),
        json={"action": "accept"},
    )
    assert forbidden.status_code == 404

    allowed = await client.post(
        f"/api/v1/matches/{match_id}/action",
        headers=_auth(token_b),
        json={"action": "accept"},
    )
    assert allowed.status_code == 200


@pytest.mark.asyncio
async def test_user_profile_update_rejects_sensitive_fields(client):
    token, _ = await _register(client, "13900138009", "Profile Owner")

    malicious = await client.put(
        "/api/v1/users/me",
        headers=_auth(token),
        json={
            "nickname": "Changed",
            "status": "suspended",
            "password_hash": "attacker-controlled",
        },
    )
    assert malicious.status_code == 422

    allowed = await client.put(
        "/api/v1/users/me",
        headers=_auth(token),
        json={"nickname": "Changed", "bio": "Safe profile update"},
    )
    assert allowed.status_code == 200
    assert allowed.json()["nickname"] == "Changed"
    assert allowed.json()["status"] == "distilling"
