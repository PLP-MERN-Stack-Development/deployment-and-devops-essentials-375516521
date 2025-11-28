// client/src/socket.js
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
let socket;

export function connectSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: true,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function getSocket() {
  return socket || connectSocket();
}
