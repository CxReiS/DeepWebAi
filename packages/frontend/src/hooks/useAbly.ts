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
