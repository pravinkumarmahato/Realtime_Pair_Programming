import { useMemo } from 'react';
import { useAppSelector } from '../hooks/store';
import type { RootState } from '@/store';

const statusCopy: Record<string, string> = {
  idle: 'Offline',
  connecting: 'Connecting…',
  connected: 'Live',
  error: 'Error'
};

const StatusBar = () => {
  const { roomId, status, participants } = useAppSelector((state: RootState) => state.room);

  const tone = useMemo(() => {
    switch (status) {
      case 'connected':
        return 'ok';
      case 'error':
        return 'error';
      case 'connecting':
        return 'warn';
      default:
        return 'idle';
    }
  }, [status]);

  return (
    <footer className="status-bar" data-tone={tone}>
      <span>{statusCopy[status]}</span>
      <span>
        Participants: <strong>{participants}</strong>
      </span>
      <span className="room-chip">{roomId ? `Room #${roomId}` : 'No room selected'}</span>
    </footer>
  );
};

export default StatusBar;
