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
export declare const CHANNELS: {
    readonly CHAT: "chat";
    readonly NOTIFICATIONS: "notifications";
    readonly AI_STATUS: "ai-status";
    readonly USER_PRESENCE: "user-presence";
};
export type ChannelName = typeof CHANNELS[keyof typeof CHANNELS];
export declare const EVENTS: {
    readonly CHAT: {
        readonly MESSAGE: "message";
        readonly TYPING_START: "typing_start";
        readonly TYPING_END: "typing_end";
    };
    readonly NOTIFICATIONS: {
        readonly NOTIFICATION: "notification";
    };
    readonly AI_STATUS: {
        readonly STATUS_UPDATE: "status_update";
    };
    readonly USER_PRESENCE: {
        readonly USER_JOINED: "user_joined";
        readonly USER_LEFT: "user_left";
        readonly STATUS_CHANGE: "status_change";
    };
};
