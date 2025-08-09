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

import { useEffect, useState, useRef } from 'react';
import * as Ably from 'ably';

interface UseAblyOptions {
  clientId?: string;
  authUrl?: string;
}

export const useAbly = (options?: UseAblyOptions) => {
  const [client, setClient] = useState<Ably.Realtime | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<Ably.Realtime | null>(null);

  useEffect(() => {
    // Initialize Ably client
    const ablyClient = new Ably.Realtime({
      authUrl: options?.authUrl || '/api/auth/ably-token',
      clientId: options?.clientId || `user-${Date.now()}`,
    });

    clientRef.current = ablyClient;
    setClient(ablyClient);

    // Connection state handlers
    const handleConnectionStateChange = (state: Ably.ConnectionState) => {
      setIsConnected(state === 'connected');
      if (state === 'failed') {
        setError('Connection failed');
      } else {
        setError(null);
      }
    };

    ablyClient.connection.on('connected', () => handleConnectionStateChange('connected'));
    ablyClient.connection.on('disconnected', () => handleConnectionStateChange('disconnected'));
    ablyClient.connection.on('failed', () => handleConnectionStateChange('failed'));

    return () => {
      ablyClient.close();
    };
  }, [options?.authUrl, options?.clientId]);

  return { client, isConnected, error };
};

export const useChannel = (channelName: string, eventName: string, callback: (message: Ably.Message) => void) => {
  const [messages, setMessages] = useState<Ably.Message[]>([]);
  const { client } = useAbly();

  useEffect(() => {
    if (!client) return;

    const channel = client.channels.get(channelName);
    
    const messageHandler = (message: Ably.Message) => {
      callback(message);
      setMessages(prev => [...prev, message]);
    };

    channel.subscribe(eventName, messageHandler);

    return () => {
      channel.unsubscribe(eventName, messageHandler);
    };
  }, [client, channelName, eventName, callback]);

  const publish = (data: any) => {
    if (client) {
      const channel = client.channels.get(channelName);
      channel.publish(eventName, data);
    }
  };

  return { messages, publish };
};
