// server/socket.js
const { addUser, removeUser, getUserBySocket, getAllUsers,
        addMessageToRoom, paginateRoomMessages, getRoom } = require('./data/store');
const { v4: uuidv4 } = require('uuid');

module.exports = (io) => {
  // Optionally: namespace per app area - keep default namespace for simplicity
  io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    // Handle simple username "login"
    // client emits 'login' with { username }, server responds with user object
    socket.on('login', (payload, callback) => {
      const { username } = payload || {};
      if (!username) return callback?.({ status: 'error', message: 'No username' });

      const user = addUser({ username, socketId: socket.id });

      // join default room
      socket.join('global');
      user.currentRoom = 'global';

      // Notify others that user joined
      socket.broadcast.emit('user:joined', { user: { username: user.username, userId: user.userId } });

      // Emit online users list
      io.emit('users:list', getAllUsers().map(u => ({ username: u.username, userId: u.userId, socketId: u.socketId })));

      callback?.({ status: 'ok', user });
    });

    // Request to fetch messages with pagination
    // payload: { roomId, offset, limit }
    socket.on('messages:load', (payload, callback) => {
      try {
        const { roomId = 'global', offset = 0, limit = 20 } = payload || {};
        const messages = paginateRoomMessages(roomId, { offset, limit });
        callback?.({ status: 'ok', messages });
      } catch (err) {
        callback?.({ status: 'error', message: err.message });
      }
    });

    // Create message in a room. payload: { roomId, text, attachments? }
    // We'll use ACK to guarantee delivery: callback({ status, messageId })
    socket.on('message:create', (payload, callback) => {
      const sender = getUserBySocket(socket.id);
      if (!sender) return callback?.({ status: 'error', message: 'Not authenticated' });
      const { roomId = 'global', text, attachments = [] } = payload || {};
      const msg = {
        id: uuidv4(),
        roomId,
        text,
        attachments,
        sender: { userId: sender.userId, username: sender.username },
        timestamp: Date.now(),
        reactions: {},
        readBy: []
      };
      addMessageToRoom(roomId, msg);

      // Broadcast to room
      io.to(roomId).emit('message:new', msg);

      // ACK to sender that message stored with id
      callback?.({ status: 'ok', message: msg });
    });

    // Private message: payload { toSocketId, text, attachments }
    socket.on('message:private', (payload, callback) => {
      const sender = getUserBySocket(socket.id);
      if (!sender) return callback?.({ status: 'error', message: 'Not authenticated' });
      const { toSocketId, text, attachments = [] } = payload || {};
      const msg = {
        id: uuidv4(),
        private: true,
        toSocketId,
        sender: { userId: sender.userId, username: sender.username },
        text,
        attachments,
        timestamp: Date.now(),
        reactions: {},
        readBy: []
      };

      // emit to recipient and sender
      socket.to(toSocketId).emit('message:private:new', msg);
      socket.emit('message:private:new', msg);

      // Optionally store messages in a "private:userid1:userid2" room for history
      callback?.({ status: 'ok', message: msg });
    });

    // Typing indicator: payload { roomId, isTyping }
    socket.on('typing', (payload) => {
      const sender = getUserBySocket(socket.id);
      if (!sender) return;
      const { roomId = 'global', isTyping = false } = payload || {};
      socket.to(roomId).emit('typing', { username: sender.username, userId: sender.userId, isTyping });
    });

    // Join a room
    socket.on('join:room', (payload, callback) => {
      const sender = getUserBySocket(socket.id);
      if (!sender) return callback?.({ status: 'error', message: 'Not authenticated' });
      const { roomId } = payload || {};
      if (!roomId) return callback?.({ status: 'error', message: 'No roomId' });

      socket.join(roomId);
      sender.currentRoom = roomId;

      // notify room
      socket.to(roomId).emit('user:joined:room', { username: sender.username, userId: sender.userId, roomId });

      callback?.({ status: 'ok', roomId });
    });

    // Leave a room
    socket.on('leave:room', (payload, callback) => {
      const sender = getUserBySocket(socket.id);
      const { roomId } = payload || {};
      if (roomId) {
        socket.leave(roomId);
        socket.to(roomId).emit('user:left:room', { username: sender?.username, userId: sender?.userId, roomId });
      }
      if (callback) callback({ status: 'ok' });
    });

    // Reaction to a message: payload { roomId, messageId, reaction, action: 'add'|'remove' }
    socket.on('message:reaction', (payload, callback) => {
      const sender = getUserBySocket(socket.id);
      if (!sender) return callback?.({ status: 'error', message: 'Not authenticated' });

      const { roomId = 'global', messageId, reaction, action = 'add' } = payload || {};
      const room = getRoom(roomId);
      const msg = room.messages.find(m => m.id === messageId);
      if (!msg) return callback?.({ status: 'error', message: 'message not found' });

      msg.reactions = msg.reactions || {};
      msg.reactions[reaction] = msg.reactions[reaction] || new Set();

      if (action === 'add') msg.reactions[reaction].add(sender.userId);
      else msg.reactions[reaction].delete(sender.userId);

      // Convert sets to arrays for transport:
      const transformed = {};
      for (const r in msg.reactions) transformed[r] = Array.from(msg.reactions[r]);

      io.to(roomId).emit('message:reaction', { messageId, reactions: transformed });
      callback?.({ status: 'ok' });
    });

    // Mark message read: payload { roomId, messageId }
    socket.on('message:read', (payload, callback) => {
      const sender = getUserBySocket(socket.id);
      if (!sender) return callback?.({ status: 'error', message: 'Not authenticated' });
      const { roomId = 'global', messageId } = payload || {};
      const room = getRoom(roomId);
      const msg = room.messages.find(m => m.id === messageId);
      if (!msg) return callback?.({ status: 'error', message: 'message not found' });

      msg.readBy = msg.readBy || [];
      if (!msg.readBy.includes(sender.userId)) msg.readBy.push(sender.userId);
      io.to(roomId).emit('message:read', { messageId, userId: sender.userId });
      callback?.({ status: 'ok' });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      const user = removeUser(socket.id);
      if (user) {
        io.emit('user:left', { username: user.username, userId: user.userId });
        io.emit('users:list', getAllUsers().map(u => ({ username: u.username, userId: u.userId, socketId: u.socketId })));
      }
      console.log('socket disconnected', socket.id, reason);
    });

    // A simple ping to check connection and measure latency
    socket.on('ping:client', (cb) => {
      cb({ serverTime: Date.now() });
    });
  });
};
