from typing import Any, TypeVar

from fastapi import Depends, Request, WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..services.realtime import RealtimeRoomHub
from ..services.rooms import RoomService
from ..services.suggestions import SuggestionService

TService = TypeVar('TService')


def get_realtime_hub(request: Request) -> RealtimeRoomHub:
    return _get_state_service(request.app.state, 'realtime_hub', RealtimeRoomHub)


def get_realtime_hub_from_websocket(websocket: WebSocket) -> RealtimeRoomHub:
    return _get_state_service(websocket.app.state, 'realtime_hub', RealtimeRoomHub)


def get_suggestion_service(request: Request) -> SuggestionService:
    return _get_state_service(request.app.state, 'suggestion_service', SuggestionService)


def get_room_service(session: AsyncSession = Depends(get_session)) -> RoomService:
    return RoomService(session)


def _get_state_service(state: Any, attribute: str, expected_type: type[TService]) -> TService:
    service = getattr(state, attribute, None)
    if not isinstance(service, expected_type):
        raise RuntimeError(f'{attribute} is not configured on the application state.')
    return service
