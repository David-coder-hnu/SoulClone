from unittest.mock import AsyncMock

import pytest

from app.websocket.manager import ConnectionManager


@pytest.mark.asyncio
async def test_manager_supports_multiple_connections_and_safe_disconnect():
    manager = ConnectionManager()
    first = AsyncMock()
    second = AsyncMock()

    await manager.connect(first, "user-1")
    await manager.connect(second, "user-1")
    await manager.send_personal_message({"type": "test"}, "user-1")

    first.send_json.assert_awaited_once_with({"type": "test"})
    second.send_json.assert_awaited_once_with({"type": "test"})

    manager.disconnect(first, "user-1")
    manager.disconnect(first, "user-1")
    assert manager.active_connections["user-1"] == [second]

    manager.disconnect(second, "user-1")
    assert "user-1" not in manager.active_connections


@pytest.mark.asyncio
async def test_manager_removes_connections_that_fail_during_send():
    manager = ConnectionManager()
    healthy = AsyncMock()
    broken = AsyncMock()
    broken.send_json.side_effect = RuntimeError("connection closed")

    await manager.connect(healthy, "user-1")
    await manager.connect(broken, "user-1")
    await manager.send_personal_message({"type": "test"}, "user-1")

    healthy.send_json.assert_awaited_once()
    assert manager.active_connections["user-1"] == [healthy]
