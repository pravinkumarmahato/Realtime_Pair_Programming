import { type ChangeEvent, useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import { useAppDispatch, useAppSelector } from '../hooks/store';
import type { RootState } from '@/store';
import { createRoom, setRoomId, setUsername } from '../store/roomSlice';

const RoomPanel = () => {
  const dispatch = useAppDispatch();
  const { roomId, username, status, error } = useAppSelector((state: RootState) => state.room);
  const [nameInput, setNameInput] = useState(username);
  const [joinInput, setJoinInput] = useState('');

  const shareUrl = useMemo(() => {
    if (!roomId || typeof window === 'undefined') {
      return '';
    }
    const origin = window.location.origin;
    return `${origin}/room/${roomId}`;
  }, [roomId]);

  const ensureUsername = () => {
    const nextName = nameInput.trim() || `User-${nanoid(4)}`;
    setNameInput(nextName);
    dispatch(setUsername(nextName));
    return nextName;
  };

  const handleCreateRoom = () => {
    ensureUsername();
    dispatch(createRoom());
  };

  const handleJoinRoom = () => {
    const normalized = joinInput.trim();
    if (!normalized) {
      return;
    }
    ensureUsername();
    dispatch(setRoomId(normalized));
  };

  const handleCopy = async () => {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (clipError) {
      console.warn('Clipboard unavailable', clipError);
    }
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNameInput(event.target.value);
  };

  const handleJoinInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setJoinInput(event.target.value);
  };

  return (
    <div className="panel">
      <div>
        <p className="panel-title">Realtime Pair Room</p>
        <label className="panel-label" htmlFor="username-input">
          Display name
        </label>
        <input
          id="username-input"
          className="panel-input"
          value={nameInput}
          onChange={handleNameChange}
          placeholder="Pick a handle"
        />
      </div>

      <div className="panel-section">
        <button className="panel-button" type="button" onClick={handleCreateRoom} disabled={status === 'connecting'}>
          {status === 'connecting' ? 'Spinning up...' : 'Create new room'}
        </button>
      </div>

      <div className="panel-section">
        <label className="panel-label" htmlFor="join-input">
          Join existing room
        </label>
        <input
          id="join-input"
          className="panel-input"
          value={joinInput}
          onChange={handleJoinInputChange}
          placeholder="Enter room id"
        />
        <button className="panel-button secondary" type="button" onClick={handleJoinRoom}>
          Join room
        </button>
      </div>

      {shareUrl && (
        <div className="panel-section">
          <p className="panel-label">Share link</p>
          <code className="share-link">{shareUrl}</code>
          <button className="panel-button ghost" type="button" onClick={handleCopy}>
            Copy link
          </button>
        </div>
      )}

      {error && <p className="panel-error">{error}</p>}
    </div>
  );
};

export default RoomPanel;
