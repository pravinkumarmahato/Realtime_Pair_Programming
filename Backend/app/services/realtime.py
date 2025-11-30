from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass, field
from typing import Any

from fastapi import WebSocket


@dataclass
class RoomState:
    code: str = '# Start collaborating...\n'
    language: str = 'python'
    connections: set[WebSocket] = field(default_factory=set)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)


class RealtimeRoomHub:
    """In-memory coordinator that tracks websocket connections per room."""

    def __init__(self) -> None:
        self._states: dict[str, RoomState] = {}
        self._lock = asyncio.Lock()

    async def prime(self, room_id: str, *, code: str, language: str = 'python') -> None:
        state = await self._get_state(room_id)
        async with state.lock:
            state.code = code
            state.language = language

    async def connect(self, room_id: str, websocket: WebSocket) -> RoomState:
        state = await self._get_state(room_id)
        await websocket.accept()
        async with state.lock:
            state.connections.add(websocket)
        await self.broadcast_participants(room_id)
        await websocket.send_json({'type': 'sync', 'code': state.code, 'language': state.language})
        return state

    async def disconnect(self, room_id: str, websocket: WebSocket) -> None:
        state = await self._get_state(room_id)
        async with state.lock:
            state.connections.discard(websocket)
        await self.broadcast_participants(room_id)

    async def broadcast_participants(self, room_id: str) -> None:
        state = await self._get_state(room_id)
        payload = {'participants': len(state.connections)}
        await self._broadcast(state, payload)

    async def broadcast_delta(self, room_id: str, *, code: str, author: str | None = None) -> None:
        state = await self._get_state(room_id)
        async with state.lock:
            state.code = code
        payload = {'type': 'sync', 'code': code, 'author': author}
        await self._broadcast(state, payload)

    async def participant_count(self, room_id: str) -> int:
        state = await self._get_state(room_id)
        return len(state.connections)

    async def _broadcast(self, state: RoomState, message: dict[str, Any]) -> None:
        dead: list[WebSocket] = []
        text = json.dumps(message)
        for connection in list(state.connections):
            try:
                await connection.send_text(text)
            except Exception:
                dead.append(connection)
        if dead:
            async with state.lock:
                for conn in dead:
                    state.connections.discard(conn)

    async def _get_state(self, room_id: str) -> RoomState:
        async with self._lock:
            if room_id not in self._states:
                self._states[room_id] = RoomState()
            return self._states[room_id]
