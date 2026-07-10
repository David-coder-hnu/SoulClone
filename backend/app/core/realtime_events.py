from __future__ import annotations

import asyncio
from contextlib import suppress
import json
import logging

from app.core.redis_client import redis_client
from app.websocket.manager import manager


logger = logging.getLogger(__name__)
REALTIME_CHANNEL = "soulclone:realtime"


async def publish_to_users(payload: dict, user_ids: list[str]) -> None:
    """Publish a cross-process event for delivery by every WebSocket server."""
    try:
        await redis_client.publish(
            REALTIME_CHANNEL,
            json.dumps({"payload": payload, "user_ids": user_ids}),
        )
    except Exception:
        # Message persistence is the source of truth; a transient realtime
        # outage must not turn a successfully generated reply into a failure.
        logger.warning("Failed to publish realtime event", exc_info=True)


async def run_realtime_event_forwarder() -> None:
    """Forward Redis pub/sub events to connections owned by this web process."""
    retry_delay = 1
    while True:
        try:
            await _forward_realtime_events()
            retry_delay = 1
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.warning("Realtime event forwarder disconnected", exc_info=True)
            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 30)


async def _forward_realtime_events() -> None:
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(REALTIME_CHANNEL)
    try:
        while True:
            message = await pubsub.get_message(
                ignore_subscribe_messages=True,
                timeout=1.0,
            )
            if message is None:
                await asyncio.sleep(0.01)
                continue
            try:
                event = json.loads(message["data"])
                await manager.send_to_users(
                    event["payload"],
                    [str(user_id) for user_id in event["user_ids"]],
                )
            except (KeyError, TypeError, ValueError, json.JSONDecodeError):
                logger.warning("Ignoring invalid realtime event")
    finally:
        with suppress(Exception):
            await pubsub.unsubscribe(REALTIME_CHANNEL)
        close = getattr(pubsub, "aclose", None) or getattr(pubsub, "close", None)
        if close is not None:
            with suppress(Exception):
                await close()
