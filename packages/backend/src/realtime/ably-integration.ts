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

import * as Ably from 'ably';
import { config } from '../elysia.config.js';

// Initialize Ably client
export const ablyClient = new Ably.Realtime({
  key: config.ablyApiKey,
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
