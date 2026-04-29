import asyncio
from typing import Dict, AsyncGenerator

from app.config import settings
import redis.asyncio as redis


class SSENotifier:
    def __init__(self):
        self.channels: Dict[str, asyncio.Queue] = {}

    async def get_stream(self, user_id: str) -> AsyncGenerator[str, None]:
        if user_id not in self.channels:
            self.channels[user_id] = asyncio.Queue()

        queue = self.channels[user_id]
        while True:
            try:
                message = await asyncio.wait_for(queue.get(), timeout=30)
                yield f"data: {message}\n\n"
            except asyncio.TimeoutError:
                yield "data: ping\n\n"

    async def notify(self, user_id: str, message: str):
        if user_id in self.channels:
            await self.channels[user_id].put(message)


notifier = SSENotifier()
