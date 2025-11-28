// client/src/App.jsx
import React, { useEffect, useState, useRef } from 'react';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import ChatRoomList from './components/ChatRoomList';
import PrivateChat from './components/PrivateChat';
import Notifications from './components/Notifications';
import { connectSocket } from './socket';

export default function App() {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [rooms] = useState(['global', 'sports', 'tech']);
  const [activeRoom, setActiveRoom] = useState('global');
  const [messages, setMessages] = useState({});
  const [privateMessages, setPrivateMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const s = connectSocket();
    socketRef.current = s;
    setSocket(s);

    // Example events
    s.on('users:list', (users) => setOnlineUsers(users));
    s.on('message:new', (message) => {
      setMessages((prev) => {
        const roomMsgs = prev[message.roomId] || [];
        return { ...prev, [message.roomId]: [...roomMsgs, message] };
      });
    });

    // Cleanup on unmount
    return () => {
      if (s) s.disconnect();
    };
  }, []);

  const addNotification = (text) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 5000);
  };

  if (!socket) return <div>Connecting…</div>;
  if (!user) return <Login socket={socket} onLogin={setUser} />;

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Rooms</h2>
        <ChatRoomList
          rooms={rooms}
          activeRoom={activeRoom}
          setActiveRoom={setActiveRoom}
        />
        <div className="user-info">
          Logged in as <strong>{user.username}</strong>
        </div>
        <div className="online-users">
          <h3>Online Users</h3>
          <ul>{onlineUsers.map((u) => <li key={u}>{u}</li>)}</ul>
        </div>
      </aside>
      <main className="main">
        <ChatRoom
          socket={socket}
          user={user}
          roomId={activeRoom}
          messages={messages[activeRoom] || []}
        />
        <PrivateChat
          socket={socket}
          user={user}
          privateMessages={privateMessages}
        />
      </main>
      <Notifications notifications={notifications} />
    </div>
  );
}
