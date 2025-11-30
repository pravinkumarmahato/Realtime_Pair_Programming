from fastapi import APIRouter, Depends, HTTPException

from ...schemas.room import RoomCreateResponse, RoomState
from ...services.realtime import RealtimeRoomHub
from ...services.rooms import RoomService
from ..deps import get_realtime_hub, get_room_service

router = APIRouter(prefix='/rooms', tags=['rooms'])


@router.post('/', response_model=RoomCreateResponse)
async def create_room(
    service: RoomService = Depends(get_room_service),
    hub: RealtimeRoomHub = Depends(get_realtime_hub)
) -> RoomCreateResponse:
    room = await service.create_room()
    await hub.prime(room.id, code=room.code, language=room.language)
    return RoomCreateResponse(roomId=room.id)


@router.get('/{room_id}', response_model=RoomState)
async def get_room(
    room_id: str,
    service: RoomService = Depends(get_room_service),
    hub: RealtimeRoomHub = Depends(get_realtime_hub)
) -> RoomState:
    room = await service.get_room(room_id)
    if room is None:
        raise HTTPException(status_code=404, detail='Room not found')
    participants = await hub.participant_count(room_id)
    return RoomState(
        roomId=room.id,
        code=room.code,
        language=room.language,
        participants=participants,
        updatedAt=room.updated_at,
        lastAuthor=room.last_author
    )
