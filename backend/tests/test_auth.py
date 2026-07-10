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
