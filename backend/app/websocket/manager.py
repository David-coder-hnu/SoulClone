import logging

from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        connections = self.active_connections.get(user_id)
        if not connections:
            return
        if websocket in connections:
            connections.remove(websocket)
        if not connections:
            self.active_connections.pop(user_id, None)

    async def send_personal_message(self, message: dict, user_id: str):
        await self._send_to_connections(
            message,
            user_id,
            list(self.active_connections.get(user_id, [])),
        )

    async def broadcast(self, message: dict):
        for user_id, connections in list(self.active_connections.items()):
            await self._send_to_connections(message, user_id, list(connections))

    async def send_to_users(self, message: dict, user_ids: list[str]):
        """Send a message only to specific users (privacy-safe)."""
        for uid in user_ids:
            await self._send_to_connections(
                message,
                uid,
                list(self.active_connections.get(uid, [])),
            )

    async def _send_to_connections(
        self,
        message: dict,
        user_id: str,
        connections: list[WebSocket],
    ) -> None:
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception:
                logger.warning(
                    "Removing failed WebSocket connection",
                    extra={"user_id": user_id},
                )
                self.disconnect(connection, user_id)


manager = ConnectionManager()
