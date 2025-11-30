import { useEffect } from 'react';

import { connectToRoom, type IncomingCodePayload } from '@/services/websocket';
import { applyRemoteCode, setParticipants, setStatus } from '@/store/roomSlice';

import { useAppDispatch, useAppSelector } from './store';
import { useLatestRef } from './useLatestRef';

export const useRoomConnection = () => {
  const dispatch = useAppDispatch();
  const { roomId, code } = useAppSelector(state => state.room);
  const latestCodeRef = useLatestRef(code);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    dispatch(setStatus('connecting'));
    const connection = connectToRoom(roomId, {
      onOpen: () => dispatch(setStatus('connected')),
      onClose: () => dispatch(setStatus('idle')),
      onError: () => dispatch(setStatus('error')),
      onParticipants: count => dispatch(setParticipants(count)),
      onCode: (payload: IncomingCodePayload) => {
        if (payload.code !== latestCodeRef.current) {
          dispatch(applyRemoteCode(payload.code));
        }
      }
    });

    return () => connection.disconnect();
  }, [roomId, dispatch, latestCodeRef]);
};
