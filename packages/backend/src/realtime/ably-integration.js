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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAblyStatus = exports.onConnectionStateChange = exports.subscribeToChannel = exports.publishMessage = exports.getChannel = exports.channels = exports.ablyClient = void 0;
const Ably = __importStar(require("ably"));
const elysia_config_1 = require("../src/elysia.config");
// Initialize Ably client
exports.ablyClient = new Ably.Realtime({
    key: elysia_config_1.config.ABLY_API_KEY,
    // Additional options
    clientId: 'deepwebai-backend',
    environment: 'production',
    logLevel: 0, // Error level only
});
// Channel definitions
exports.channels = {
    CHAT: 'chat',
    NOTIFICATIONS: 'notifications',
    AI_STATUS: 'ai-status',
    USER_PRESENCE: 'user-presence',
};
// Get or create a channel
const getChannel = (channelName) => {
    return exports.ablyClient.channels.get(channelName);
};
exports.getChannel = getChannel;
// Publish message to channel
const publishMessage = async (channelName, eventName, data) => {
    const channel = (0, exports.getChannel)(channelName);
    await channel.publish(eventName, data);
};
exports.publishMessage = publishMessage;
// Subscribe to channel messages
const subscribeToChannel = (channelName, eventName, callback) => {
    const channel = (0, exports.getChannel)(channelName);
    channel.subscribe(eventName, callback);
    return () => channel.unsubscribe(eventName, callback);
};
exports.subscribeToChannel = subscribeToChannel;
// Connection state management
const onConnectionStateChange = (callback) => {
    exports.ablyClient.connection.on('connected', () => callback('connected'));
    exports.ablyClient.connection.on('disconnected', () => callback('disconnected'));
    exports.ablyClient.connection.on('failed', () => callback('failed'));
};
exports.onConnectionStateChange = onConnectionStateChange;
// Health check for monitoring
const getAblyStatus = () => {
    return {
        state: exports.ablyClient.connection.state,
        errorInfo: exports.ablyClient.connection.errorReason,
        id: exports.ablyClient.connection.id,
    };
};
exports.getAblyStatus = getAblyStatus;
