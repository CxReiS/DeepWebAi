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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketPlugin = void 0;
const elysia_1 = require("elysia");
const ably_integration_1 = require("./ably-integration");
// WebSocket plugin for Elysia
exports.websocketPlugin = new elysia_1.Elysia({ name: 'websocket' })
    .ws('/ws/chat', {
    message(ws, message) {
        // Broadcast chat message to all clients
        (0, ably_integration_1.publishMessage)(ably_integration_1.channels.CHAT, 'message', {
            userId: ws.data.userId || 'anonymous',
            message,
            timestamp: new Date().toISOString(),
        });
    },
    open(ws) {
        console.log('WebSocket connection opened');
        (0, ably_integration_1.publishMessage)(ably_integration_1.channels.USER_PRESENCE, 'user_joined', {
            userId: ws.data.userId || 'anonymous',
            timestamp: new Date().toISOString(),
        });
    },
    close(ws) {
        console.log('WebSocket connection closed');
        (0, ably_integration_1.publishMessage)(ably_integration_1.channels.USER_PRESENCE, 'user_left', {
            userId: ws.data.userId || 'anonymous',
            timestamp: new Date().toISOString(),
        });
    },
})
    .ws('/ws/ai-status', {
    message(ws, message) {
        // Handle AI status updates
        (0, ably_integration_1.publishMessage)(ably_integration_1.channels.AI_STATUS, 'status_update', {
            status: message,
            timestamp: new Date().toISOString(),
        });
    },
})
    .get('/api/realtime/status', () => {
    return {
        ably: (0, ably_integration_1.getAblyStatus)(),
        channels: Object.values(ably_integration_1.channels),
        timestamp: new Date().toISOString(),
    };
});
// Export for use in main server
exports.default = exports.websocketPlugin;
