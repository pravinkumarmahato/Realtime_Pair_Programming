import logging

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from ...schemas.realtime import RealtimeUpdate
from ...services.realtime import RealtimeRoomHub
from ...services.rooms import RoomService
from ..deps import get_realtime_hub_from_websocket, get_room_service


logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket('/ws/{room_id}')
async def websocket_room(
    websocket: WebSocket,
    room_id: str,
    service: RoomService = Depends(get_room_service),
    hub: RealtimeRoomHub = Depends(get_realtime_hub_from_websocket)
) -> None:
    """Bi-directional websocket endpoint that synchronizes editor state per room."""

    room = await service.ensure_room(room_id)
    await hub.prime(room_id, code=room.code, language=room.language)
    await hub.connect(room_id, websocket)

    try:
        while True:
            raw_payload = await websocket.receive_json()
            try:
                payload = RealtimeUpdate.model_validate(raw_payload)
            except ValidationError:
                logger.debug('Ignored invalid realtime payload: %s', raw_payload)
                continue

            await service.update_code(room_id=room_id, code=payload.code, author=payload.username)
            await hub.broadcast_delta(room_id, code=payload.code, author=payload.username)
    except WebSocketDisconnect:
        await hub.disconnect(room_id, websocket)
    except Exception:
        await hub.disconnect(room_id, websocket)
        raise
