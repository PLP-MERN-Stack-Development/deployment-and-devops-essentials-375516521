import React from 'react';

export default function MessageList({ messages = [], onReact, onRead }) {
  return (
    <ul className="message-list">
      {messages.map(m => (
        <li key={m.id} className="message">
          <div className="meta">
            <strong>{m.sender?.username}</strong>
            <span className="time">{new Date(m.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className="text">{m.text}</div>
          {m.attachments?.map((a,i) => (
            <div key={i} className="attachment">
              {a.type?.startsWith('image') ? <img src={a.url} alt="attachment" /> : <a href={a.url}>Download</a>}
            </div>
          ))}
          <div className="reactions">
            {m.reactions && Object.entries(m.reactions).map(([r, users]) => (
              <button key={r}>{r} {users.length}</button>
            ))}
            <button onClick={() => onReact(m.id, '👍')}>👍</button>
            <button onClick={() => onRead(m.id)}>Mark read</button>
          </div>
          <div className="read-info">
            Read by: {(m.readBy || []).length}
          </div>
        </li>
      ))}
    </ul>
  );
}
