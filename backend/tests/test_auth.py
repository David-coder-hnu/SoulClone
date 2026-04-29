import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_register_and_login():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register
        res = await client.post("/api/v1/auth/register", json={
            "phone": "13800138000",
            "password": "password123",
            "nickname": "TestUser",
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert "refresh_token" in data

        # Login
        res = await client.post("/api/v1/auth/login", json={
            "phone": "13800138000",
            "password": "password123",
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
