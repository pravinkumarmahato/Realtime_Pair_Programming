from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class RoomCreateResponse(BaseModel):
    roomId: str = Field(..., description='Unique room identifier')


class RoomState(BaseModel):
    roomId: str
    code: str
    language: str = 'python'
    participants: int = 1
    updatedAt: Optional[datetime] = None
    lastAuthor: Optional[str] = None
