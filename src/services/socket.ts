import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function joinUserRoom(userId: string) {
  const s = getSocket();
  if (s.connected) {
    s.emit('join_user', userId);
  } else {
    s.once('connect', () => {
      s.emit('join_user', userId);
    });
  }
}
