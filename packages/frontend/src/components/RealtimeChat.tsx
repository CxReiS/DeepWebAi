import React, { useState, useCallback } from 'react';
import { useChannel } from '../hooks/useAbly';

interface ChatMessage {
  userId: string;
  message: string;
  timestamp: string;
}

export const RealtimeChat: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  
  const handleMessage = useCallback((message: any) => {
    console.log('Received message:', message.data);
  }, []);

  const { messages, publish } = useChannel('chat', 'message', handleMessage);

  const sendMessage = () => {
    if (inputMessage.trim()) {
      publish({
        userId: 'current-user',
        message: inputMessage,
        timestamp: new Date().toISOString(),
      });
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="realtime-chat">
      <div className="chat-messages">
        {messages.map((msg, index) => {
          const data = msg.data as ChatMessage;
          return (
            <div key={index} className="message">
              <span className="user">{data.userId}:</span>
              <span className="text">{data.message}</span>
              <span className="time">{new Date(data.timestamp).toLocaleTimeString()}</span>
            </div>
          );
        })}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};
