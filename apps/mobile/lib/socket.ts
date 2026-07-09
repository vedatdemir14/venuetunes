import type { ServerToClientEvents } from '@venuetunes/shared';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from './store';

type RtSocket = Socket<ServerToClientEvents>;

let socket: RtSocket | null = null;

/** Mevcut oturum için socket bağlantısı (tekil) */
export function getSocket(): RtSocket {
  const { apiUrl, token } = useAppStore.getState();
  if (socket?.connected) return socket;

  socket?.disconnect();
  socket = io(`${apiUrl}/rt`, {
    transports: ['websocket'],
    auth: { token },
  }) as RtSocket;

  return socket;
}

export function closeSocket() {
  socket?.disconnect();
  socket = null;
}
