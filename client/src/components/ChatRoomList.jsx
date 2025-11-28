import React from 'react';

export default function ChatRoomList({ rooms, activeRoom, setActiveRoom }) {
  return (
    <ul>
      {rooms.map(r => (
        <li key={r} className={r === activeRoom ? 'active' : ''}>
          <button onClick={() => setActiveRoom(r)}>{r}</button>
        </li>
      ))}
    </ul>
  );
}
