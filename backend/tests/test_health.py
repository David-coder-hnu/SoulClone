import pytest


@pytest.mark.asyncio
async def test_liveness(client):
    response = await client.get("/health/live")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "app": "SoulClone"}


@pytest.mark.asyncio
async def test_readiness_reports_dependencies(client):
    response = await client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["checks"] == {"database": "ok", "redis": "ok"}
