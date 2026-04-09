import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(
    `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3333'}/messages`,
    {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2000,
    },
  );

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
