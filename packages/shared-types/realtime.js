// Shared types for real-time communication
// Channel definitions
export const CHANNELS = {
    CHAT: 'chat',
    NOTIFICATIONS: 'notifications',
    AI_STATUS: 'ai-status',
    USER_PRESENCE: 'user-presence',
};
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
};
