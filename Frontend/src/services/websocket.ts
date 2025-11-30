import { wsBaseUrl } from '@/config';

type ConnectionCallbacks = {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
  onParticipants?: (count: number) => void;
  onCode?: (payload: IncomingCodePayload) => void;
};

interface ConnectionHandle {
  disconnect: () => void;
}

export interface IncomingCodePayload {
  code: string;
  cursorPosition?: number;
  author?: string;
}

export interface OutgoingCodePayload {
  code: string;
  cursorPosition: number;
  username?: string;
  roomId: string;
}

class CollaborationSocket {
  private socket: WebSocket | null = null;
  private callbacks: ConnectionCallbacks | null = null;

  connect(roomId: string, callbacks: ConnectionCallbacks): ConnectionHandle {
    if (typeof window === 'undefined' || !('WebSocket' in window)) {
      console.warn('WebSocket not supported in this environment.');
      return { disconnect: () => undefined };
    }

    this.disconnect();
    this.callbacks = callbacks;
    const url = this.buildUrl(roomId);
    const ws = new WebSocket(url);
    this.socket = ws;

    ws.onopen = () => this.callbacks?.onOpen?.();
    ws.onclose = () => this.callbacks?.onClose?.();
    ws.onerror = event => this.callbacks?.onError?.(event);
    ws.onmessage = event => this.handleMessage(event);

    return { disconnect: () => this.disconnect() };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
    this.socket = null;
  }

  sendCodeUpdate(payload: OutgoingCodePayload) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'update',
      ...payload
    };

    this.socket.send(JSON.stringify(message));
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data as string);
      if (typeof data !== 'object' || data === null) {
        return;
      }

      if ('participants' in data && typeof data.participants === 'number') {
        this.callbacks?.onParticipants?.(data.participants);
      }

      if (data.type === 'sync' && typeof data.code === 'string') {
        this.callbacks?.onCode?.({
          code: data.code,
          cursorPosition: data.cursorPosition,
          author: data.author
        });
      }
    } catch (error) {
      console.warn('Failed to parse socket message', error);
    }
  }

  private buildUrl(roomId: string) {
    const base = wsBaseUrl.replace(/\/$/, '');
    return `${base}/ws/${roomId}`;
  }
}

const socket = new CollaborationSocket();

export const connectToRoom = (roomId: string, callbacks: ConnectionCallbacks) => socket.connect(roomId, callbacks);
export const pushCodeChange = (payload: OutgoingCodePayload) => socket.sendCodeUpdate(payload);
export const disconnectRoom = () => socket.disconnect();
