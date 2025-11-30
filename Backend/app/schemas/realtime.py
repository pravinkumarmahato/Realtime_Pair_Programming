from __future__ import annotations

from pydantic import BaseModel, Field


class RealtimeUpdate(BaseModel):
    """Payload describing a code buffer change sent over the websocket."""

    code: str = Field(..., min_length=0, description='Latest buffer contents')
    username: str | None = Field(default=None, description='Display name of the author')
    cursorPosition: int | None = Field(
        default=None, ge=0, description='Cursor offset reported by the publisher'
    )
