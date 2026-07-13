import { io } from 'socket.io-client';
import { getAccessToken } from '../api/client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// auth as a callback → the current access token is read on every (re)connection.
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: (cb) => cb({ token: getAccessToken() }),
});

export function connectSocket() {
  if (!socket.connected) socket.connect();
}

export function disconnectSocket() {
  if (socket.connected) socket.disconnect();
}
