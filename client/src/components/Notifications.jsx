import React from "react";

export default function Notifications({ notifications }) {
  return (
    <div className="notifications-container">
      {notifications.map((n) => (
        <div key={n.id} className="notification">
          {n.text}
        </div>
      ))}
    </div>
  );
}
