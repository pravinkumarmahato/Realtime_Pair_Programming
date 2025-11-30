import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { setRoomId } from '@/store/roomSlice';

import { useAppDispatch, useAppSelector } from './store';

export const useRoomRouting = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { roomId: routeRoomId } = useParams<{ roomId?: string }>();
  const { roomId } = useAppSelector(state => state.room);

  useEffect(() => {
    if (routeRoomId && routeRoomId !== roomId) {
      dispatch(setRoomId(routeRoomId));
    }
  }, [routeRoomId, roomId, dispatch]);

  useEffect(() => {
    if (roomId) {
      navigate(`/room/${roomId}`, { replace: true });
    }
  }, [roomId, navigate]);
};
