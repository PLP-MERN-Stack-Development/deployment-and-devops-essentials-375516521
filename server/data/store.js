// server/data/store.js
const { v4: uuidv4 } = require('uuid');

const users = {}; // socketId -> { username, userId, socketId, currentRoom }
const userIndexByName = {}; // username -> userId
const rooms = {
  global: { id: 'global', name: 'Global', messages: [] }
};

function addUser({ username, socketId }) {
  const userId = uuidv4();
  users[socketId] = { username, userId, socketId, currentRoom: 'global' };
  userIndexByName[username] = userId;
  return users[socketId];
}

function removeUser(socketId) {
  const u = users[socketId];
  if (u) {
    delete userIndexByName[u.username];
    delete users[socketId];
  }
  return u;
}

function getUserBySocket(socketId) {
  return users[socketId];
}

function getAllUsers() {
  return Object.values(users);
}

function getRoom(roomId) {
  if (!rooms[roomId]) rooms[roomId] = { id: roomId, name: roomId, messages: [] };
  return rooms[roomId];
}

function addMessageToRoom(roomId, message) {
  const room = getRoom(roomId);
  room.messages.push(message);
  // Keep last 500 messages to limit memory
  if (room.messages.length > 500) room.messages.shift();
  return message;
}

function paginateRoomMessages(roomId, { offset = 0, limit = 20 }) {
  const room = getRoom(roomId);
  const messages = room.messages.slice().reverse(); // newest first
  return messages.slice(offset, offset + limit).reverse(); // return chronological for UI
}

module.exports = {
  addUser,
  removeUser,
  getUserBySocket,
  getAllUsers,
  getRoom,
  addMessageToRoom,
  paginateRoomMessages
};
