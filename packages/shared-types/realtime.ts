// Shared types for real-time communication

export interface ChatMessage {
  userId: string;
  message: string;
  timestamp: string;
  messageId?: string;
}

export interface UserPresence {
  userId: string;
  status: 'online' | 'offline' | 'away';
  timestamp: string;
}

export interface AIStatusUpdate {
  status: 'thinking' | 'responding' | 'idle' | 'error';
  progress?: number;
  timestamp: string;
}

export interface NotificationMessage {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  userId?: string;
}

// Channel definitions
export const CHANNELS = {
  CHAT: 'chat',
  NOTIFICATIONS: 'notifications',
  AI_STATUS: 'ai-status',
  USER_PRESENCE: 'user-presence',
} as const;

export type ChannelName = typeof CHANNELS[keyof typeof CHANNELS];

// Event types for each channel
export const EVENTS = {
  CHAT: {
    MESSAGE: 'message',
    TYPING_START: 'typing_start',
    TYPING_END: 'typing_end',
  },
  NOTIFICATIONS: {
    NOTIFICATION: 'notification',
  },
  AI_STATUS: {
    STATUS_UPDATE: 'status_update',
  },
  USER_PRESENCE: {
    USER_JOINED: 'user_joined',
    USER_LEFT: 'user_left',
    STATUS_CHANGE: 'status_change',
  },
} as const;
