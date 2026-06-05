import React from 'react';
import './MessageBubble.css';

const MessageBubble = ({ message, isOwn, formatTime }) => {
  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
      <div className="message-content">
        <p>{message.content}</p>
        <div className="message-footer">
          <span className="message-time">{formatTime(message.timestamp)}</span>
          {isOwn && (
            <span className="read-status">
              {message.read ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

