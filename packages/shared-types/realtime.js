"use strict";
// Shared types for real-time communication
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENTS = exports.CHANNELS = void 0;
// Channel definitions
exports.CHANNELS = {
    CHAT: 'chat',
    NOTIFICATIONS: 'notifications',
    AI_STATUS: 'ai-status',
    USER_PRESENCE: 'user-presence',
};
// Event types for each channel
exports.EVENTS = {
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
