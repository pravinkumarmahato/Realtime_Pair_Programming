import {
  type ActionReducerMapBuilder,
  createAsyncThunk,
  createSlice,
  type PayloadAction
} from '@reduxjs/toolkit';

import { endpoints } from '@/config';

export interface AutocompleteRequest {
  code: string;
  cursorPosition: number;
  language: string;
}

export interface RoomState {
  roomId: string;
  username: string;
  code: string;
  cursorPosition: number;
  participants: number;
  status: 'idle' | 'connecting' | 'connected' | 'error';
  suggestion: {
    text: string;
    isLoading: boolean;
    lastFetched?: number;
  };
  error?: string;
}

const initialState: RoomState = {
  roomId: '',
  username: '',
  code: '# Start collaborating...\n',
  cursorPosition: 0,
  participants: 1,
  status: 'idle',
  suggestion: {
    text: '',
    isLoading: false
  }
};

export const createRoom = createAsyncThunk('room/createRoom', async () => {
  const response = await fetch(endpoints.rooms, {
    method: 'POST'
  });

  if (!response.ok) {
    throw new Error('Unable to create room.');
  }

  const data = (await response.json()) as { roomId: string };
  return data.roomId;
});

export const fetchAutocomplete = createAsyncThunk(
  'room/fetchAutocomplete',
  async (payload: AutocompleteRequest) => {
    const response = await fetch(endpoints.autocomplete, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Failed to fetch suggestion');
    }

    const data = (await response.json()) as { suggestion: string };
    return data.suggestion;
  }
);

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setRoomId(state: RoomState, action: PayloadAction<string>) {
      state.roomId = action.payload;
    },
    setUsername(state: RoomState, action: PayloadAction<string>) {
      state.username = action.payload;
    },
    setCode(state: RoomState, action: PayloadAction<string>) {
      state.code = action.payload;
    },
    setCursorPosition(state: RoomState, action: PayloadAction<number>) {
      state.cursorPosition = action.payload;
    },
    applyRemoteCode(state: RoomState, action: PayloadAction<string>) {
      state.code = action.payload;
    },
    setStatus(state: RoomState, action: PayloadAction<RoomState['status']>) {
      state.status = action.payload;
      if (state.status !== 'error') {
        state.error = undefined;
      }
    },
    setParticipants(state: RoomState, action: PayloadAction<number>) {
      state.participants = action.payload;
    },
    clearSuggestion(state: RoomState) {
      state.suggestion.text = '';
    }
  },
  extraReducers: (builder: ActionReducerMapBuilder<RoomState>) => {
    builder
      .addCase(createRoom.pending, (state: RoomState) => {
        state.status = 'connecting';
      })
      .addCase(createRoom.fulfilled, (state: RoomState, action: PayloadAction<string>) => {
        state.status = 'idle';
        state.roomId = action.payload;
      })
      .addCase(
        createRoom.rejected,
        (state: RoomState, action: ReturnType<typeof createRoom.rejected>) => {
          state.status = 'error';
          state.error = action.error.message;
        }
      )
      .addCase(fetchAutocomplete.pending, (state: RoomState) => {
        state.suggestion.isLoading = true;
      })
      .addCase(
        fetchAutocomplete.fulfilled,
        (state: RoomState, action: PayloadAction<string>) => {
          state.suggestion.isLoading = false;
          state.suggestion.text = action.payload;
          state.suggestion.lastFetched = Date.now();
        }
      )
      .addCase(fetchAutocomplete.rejected, (state: RoomState) => {
        state.suggestion.isLoading = false;
      });
  }
});

export const {
  setRoomId,
  setUsername,
  setCode,
  setCursorPosition,
  applyRemoteCode,
  setStatus,
  setParticipants,
  clearSuggestion
} = roomSlice.actions;

export default roomSlice.reducer;
