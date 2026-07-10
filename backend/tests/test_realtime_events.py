import asyncio
from contextlib import suppress
from unittest.mock import AsyncMock

import pytest

from app.core.realtime_events import (
    publish_to_users,
    run_realtime_event_forwarder,
)


@pytest.mark.asyncio
async def test_realtime_event_forwarder_bridges_redis_to_websockets(monkeypatch):
    delivered = asyncio.Event()

    async def capture_delivery(payload, user_ids):
        assert payload == {"type": "message", "content": "cross-process"}
        assert user_ids == ["user-a", "user-b"]
        delivered.set()

    send_to_users = AsyncMock(side_effect=capture_delivery)
    monkeypatch.setattr(
        "app.core.realtime_events.manager.send_to_users",
        send_to_users,
    )
    forwarder = asyncio.create_task(run_realtime_event_forwarder())
    await asyncio.sleep(0.05)
    try:
        await publish_to_users(
            {"type": "message", "content": "cross-process"},
            ["user-a", "user-b"],
        )
        await asyncio.wait_for(delivered.wait(), timeout=2)
    finally:
        forwarder.cancel()
        with suppress(asyncio.CancelledError):
            await forwarder

    send_to_users.assert_awaited_once()
