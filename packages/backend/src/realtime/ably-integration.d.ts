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
