from __future__ import annotations

import secrets
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Room


class RoomService:
    """Encapsulates persistence logic for collaborative rooms."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_room(self, *, language: str = 'python') -> Room:
        """Create and persist a new room with a randomly generated identifier."""
        room = Room(id=self._generate_room_id(), language=language)
        self.session.add(room)
        await self.session.commit()
        await self.session.refresh(room)
        return room

    async def get_room(self, room_id: str) -> Optional[Room]:
        """Return a room by identifier if it exists."""
        result = await self.session.execute(select(Room).where(Room.id == room_id))
        return result.scalar_one_or_none()

    async def ensure_room(self, room_id: str) -> Room:
        """Fetch an existing room or create a placeholder when it is missing."""
        room = await self.get_room(room_id)
        if room is None:
            room = Room(id=room_id)
            self.session.add(room)
            await self.session.commit()
            await self.session.refresh(room)
        return room

    async def update_code(self, *, room_id: str, code: str, author: Optional[str] = None) -> Room | None:
        """Persist the latest code buffer for a room and record the author."""
        room = await self.get_room(room_id)
        if room is None:
            return None
        room.code = code
        room.last_author = author
        await self.session.commit()
        await self.session.refresh(room)
        return room

    @staticmethod
    def _generate_room_id() -> str:
        return secrets.token_hex(4)
