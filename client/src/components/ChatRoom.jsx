import React, { useEffect, useState, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { uploadFile } from '../api';

export default function ChatRoom({ socket, user, roomId }) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef();

  useEffect(() => {
    if (!socket) return;

    // Join room when roomId changes
    socket.emit('join:room', { roomId }, (res) => {
      // optionally handle
    });

    // Load initial messages
    socket.emit('messages:load', { roomId, offset: 0, limit: 30 }, (res) => {
      if (res?.status === 'ok') {
        setMessages(res.messages || []);
        setOffset(res.messages?.length || 0);
      }
    });

    // Handlers
    function onNewMessage(msg) {
      if (msg.roomId === roomId || msg.private) {
        setMessages(prev => [...prev, msg]);
        playNotify(); // sound and browser notification
      }
    }
    function onUsersList(list) {
      setOnlineUsers(list);
    }
    function onTyping(payload) {
      if (payload && payload.userId !== user.userId) {
        setTypingUsers(prev => ({ ...prev, [payload.userId]: payload }));
        // remove after a timeout
        setTimeout(() => setTypingUsers(prev => {
          const cp = { ...prev };
          delete cp[payload.userId];
          return cp;
        }), 2000);
      }
    }
    function onMessageReaction(payload) {
      // payload: { messageId, reactions }
      setMessages(prev => prev.map(m => m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m));
    }
    function onMessageRead(payload) {
      setMessages(prev => prev.map(m => m.id === payload.messageId ? { ...m, readBy: [...(m.readBy || []), payload.userId] } : m));
    }

    socket.on('message:new', onNewMessage);
    socket.on('message:private:new', onNewMessage);
    socket.on('users:list', onUsersList);
    socket.on('typing', onTyping);
    socket.on('message:reaction', onMessageReaction);
    socket.on('message:read', onMessageRead);

    // cleanup on unmount or room change
    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('message:private:new', onNewMessage);
      socket.off('users:list', onUsersList);
      socket.off('typing', onTyping);
      socket.off('message:reaction', onMessageReaction);
      socket.off('message:read', onMessageRead);
      socket.emit('leave:room', { roomId });
    };
  }, [socket, roomId]);

  function sendMessage({ text, file }) {
    if (file) {
      uploadFile(file).then(({ url }) => {
        socket.emit('message:create', { roomId, text, attachments: [{ url, type: file.type }] }, (res) => {
          // handle ack
        });
      });
    } else {
      socket.emit('message:create', { roomId, text }, (res) => {
        // ack contains the stored message
      });
    }
  }

  function sendTyping(isTyping) {
    socket.emit('typing', { roomId, isTyping });
  }

  function addReaction(messageId, reaction) {
    socket.emit('message:reaction', { roomId, messageId, reaction, action: 'add' }, (res) => {});
  }

  function markRead(messageId) {
    socket.emit('message:read', { roomId, messageId }, (res) => {});
  }

  function loadOlder() {
    socket.emit('messages:load', { roomId, offset, limit: 30 }, (res) => {
      if (res?.status === 'ok') {
        const newMsgs = res.messages || [];
        if (newMsgs.length === 0) setHasMore(false);
        setMessages(prev => [...newMsgs, ...prev]);
        setOffset(prev => prev + newMsgs.length);
      }
    });
  }

  function playNotify() {
    // Sound
    const audio = new Audio('/notify.mp3'); // add notify.mp3 to client public
    audio.play().catch(() => {});
    // Browser notification
    if (Notification && Notification.permission === 'granted') {
      new Notification('New message');
    } else if (Notification && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  return (
    <div className="chatroom">
      <div className="chatheader">
        <h3>{roomId}</h3>
        <div className="online-count">Online: {onlineUsers.length}</div>
      </div>

      <div className="messages-container" ref={listRef}>
        {hasMore && <button onClick={loadOlder}>Load older messages</button>}
        <MessageList messages={messages} onReact={addReaction} onRead={markRead} />
      </div>

      <div className="typing">
        {Object.values(typingUsers).map(t => <span key={t.userId}>{t.username} is typing…</span>)}
      </div>

      <MessageInput onSend={sendMessage} onTyping={sendTyping} />
    </div>
  );
}
