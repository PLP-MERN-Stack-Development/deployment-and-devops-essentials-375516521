import React, { useState } from "react";

export default function PrivateChat({ socket, user, privateMessages, sendPrivateMessage }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState("");

  const handleSend = () => {
    if (messageText.trim() && selectedUser) {
      sendPrivateMessage(selectedUser, messageText);
      setMessageText("");
    }
  };

  return (
    <div className="private-chat">
      <h3>Private Chat</h3>
      <div className="private-users">
        {Object.keys(privateMessages).map((username) => (
          <button
            key={username}
            onClick={() => setSelectedUser(username)}
            className={selectedUser === username ? "active" : ""}
          >
            {username}
          </button>
        ))}
      </div>

      {selectedUser && (
        <div className="chat-window">
          <div className="messages">
            {(privateMessages[selectedUser] || []).map((msg, idx) => (
              <div
                key={idx}
                className={msg.from === user.username ? "message own" : "message"}
              >
                <strong>{msg.from}: </strong>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="input-box">
            <input
              type="text"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
