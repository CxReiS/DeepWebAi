/*
 * Copyright (c) 2025 [DeepWebXs]
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useCallback } from 'react';
import { useChannel } from '../hooks/useAbly';

interface ChatMessage {
  userId: string;
  message: string;
  timestamp: string;
}

export const RealtimeChat: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  
  const handleMessage = useCallback((_message: any) => {
    // Handle incoming message
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
