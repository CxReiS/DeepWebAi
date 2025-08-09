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
export declare const ablyClient: Ably.Realtime;
export declare const channels: {
    readonly CHAT: "chat";
    readonly NOTIFICATIONS: "notifications";
    readonly AI_STATUS: "ai-status";
    readonly USER_PRESENCE: "user-presence";
};
export type ChannelName = typeof channels[keyof typeof channels];
export declare const getChannel: (channelName: ChannelName) => Ably.RealtimeChannel;
export declare const publishMessage: (channelName: ChannelName, eventName: string, data: any) => Promise<void>;
export declare const subscribeToChannel: (channelName: ChannelName, eventName: string, callback: (message: Ably.Message) => void) => () => void;
export declare const onConnectionStateChange: (callback: (state: Ably.ConnectionState) => void) => void;
export declare const getAblyStatus: () => {
    state: Ably.ConnectionState;
    errorInfo: Ably.ErrorInfo;
    id: string | undefined;
};
