import * as Ably from 'ably';
import { config } from '../src/elysia.config';

// Initialize Ably client
export const ablyClient = new Ably.Realtime({
  key: config.ABLY_API_KEY,
  // Additional options
  clientId: 'deepwebai-backend',
  environment: 'production',
  logLevel: 0, // Error level only
});

// Channel definitions
export const channels = {
  CHAT: 'chat',
  NOTIFICATIONS: 'notifications',
  AI_STATUS: 'ai-status',
  USER_PRESENCE: 'user-presence',
} as const;

export type ChannelName = typeof channels[keyof typeof channels];

// Get or create a channel
export const getChannel = (channelName: ChannelName) => {
  return ablyClient.channels.get(channelName);
};

// Publish message to channel
export const publishMessage = async (
  channelName: ChannelName,
  eventName: string,
  data: any
) => {
  const channel = getChannel(channelName);
  await channel.publish(eventName, data);
};

// Subscribe to channel messages
export const subscribeToChannel = (
  channelName: ChannelName,
  eventName: string,
  callback: (message: Ably.Message) => void
) => {
  const channel = getChannel(channelName);
  channel.subscribe(eventName, callback);
  return () => channel.unsubscribe(eventName, callback);
};

// Connection state management
export const onConnectionStateChange = (callback: (state: Ably.ConnectionState) => void) => {
  ablyClient.connection.on('connected', () => callback('connected'));
  ablyClient.connection.on('disconnected', () => callback('disconnected'));
  ablyClient.connection.on('failed', () => callback('failed'));
};

// Health check for monitoring
export const getAblyStatus = () => {
  return {
    state: ablyClient.connection.state,
    errorInfo: ablyClient.connection.errorReason,
    id: ablyClient.connection.id,
  };
};
