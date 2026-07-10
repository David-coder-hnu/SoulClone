import pytest


@pytest.mark.asyncio
async def test_register_and_login(client):
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": "13800138000",
            "password": "password123",
            "nickname": "TestUser",
        },
    )
    assert register_response.status_code == 200
    tokens = register_response.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": "13800138000",
            "password": "password123",
        },
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()


@pytest.mark.asyncio
async def test_refresh_token_cannot_access_authenticated_endpoints(client):
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": "13800138009",
            "password": "password123",
            "nickname": "RefreshTokenUser",
        },
    )
    assert register_response.status_code == 200
    refresh_token = register_response.json()["refresh_token"]

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid token"}


@pytest.mark.asyncio
async def test_refresh_token_rotates_once_and_blocks_replay(client):
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": "13800138008",
            "password": "password123",
            "nickname": "RotationUser",
        },
    )
    old_refresh_token = register_response.json()["refresh_token"]

    rotate_response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": old_refresh_token},
    )
    assert rotate_response.status_code == 200
    new_tokens = rotate_response.json()
    assert new_tokens["refresh_token"] != old_refresh_token

    replay_response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": old_refresh_token},
    )
    assert replay_response.status_code == 401

    me_response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {new_tokens['access_token']}"},
    )
    assert me_response.status_code == 200


@pytest.mark.asyncio
async def test_logout_revokes_refresh_token(client):
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": "13800138007",
            "password": "password123",
            "nickname": "LogoutUser",
        },
    )
    refresh_token = register_response.json()["refresh_token"]

    logout_response = await client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token},
    )
    assert logout_response.status_code == 204

    refresh_response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_response.status_code == 401


@pytest.mark.asyncio
async def test_login_is_rate_limited_after_repeated_failures(client):
    payload = {"phone": "13800138999", "password": "wrong-password"}

    for _ in range(5):
        response = await client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 401

    blocked_response = await client.post("/api/v1/auth/login", json=payload)
    assert blocked_response.status_code == 429
    assert blocked_response.json() == {"detail": "Too many login attempts"}
