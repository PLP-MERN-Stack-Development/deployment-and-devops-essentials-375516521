import React, { useState } from 'react';

export default function Login({ socket, onLogin }) {
  const [username, setUsername] = useState('');

  function handleLogin(e) {
    e.preventDefault();
    if (!username.trim()) return;
    socket.emit('login', { username }, (resp) => {
      if (resp?.status === 'ok') {
        onLogin(resp.user);
      } else {
        alert(resp?.message || 'Login failed');
      }
    });
  }

  return (
    <div className="login">
      <h2>Join the chat</h2>
      <form onSubmit={handleLogin}>
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Pick a username" />
        <button type="submit">Join</button>
      </form>
    </div>
  );
}
