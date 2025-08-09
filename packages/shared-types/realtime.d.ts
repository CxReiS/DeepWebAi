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
