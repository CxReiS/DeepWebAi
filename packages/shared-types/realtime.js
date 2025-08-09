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
