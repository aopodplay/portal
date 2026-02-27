// src/lib/socket.ts
'use client';

import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socket) {
    socket = io('http://localhost:3000', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: {
        token, // token enviado na conexão
      },
    });
  }
  return socket;
};