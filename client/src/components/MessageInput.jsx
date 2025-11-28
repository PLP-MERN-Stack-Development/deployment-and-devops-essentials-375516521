import React, { useState, useRef } from 'react';

export default function MessageInput({ onSend, onTyping }) {
  const [text, setText] = useState('');
  const fileRef = useRef();

  function handleSend(e) {
    e.preventDefault();
    const file = fileRef.current.files[0];
    onSend({ text, file });
    setText('');
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleTyping(e) {
    setText(e.target.value);
    onTyping(true);
    // simple debounce to signal stopped typing after timeout
    clearTimeout(window._typingTimeout);
    window._typingTimeout = setTimeout(() => onTyping(false), 1000);
  }

  return (
    <form onSubmit={handleSend} className="message-input">
      <input value={text} onChange={handleTyping} placeholder="Write a message..." />
      <input type="file" ref={fileRef} />
      <button type="submit">Send</button>
    </form>
  );
}
