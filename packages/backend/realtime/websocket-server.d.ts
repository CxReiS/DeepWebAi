import { Elysia } from 'elysia';
export declare const websocketPlugin: Elysia<"", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
}, {
    ws: {
        chat: {
            subscribe: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: unknown;
            };
        };
    };
} & {
    ws: {
        "ai-status": {
            subscribe: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: unknown;
            };
        };
    };
} & {
    api: {
        realtime: {
            status: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            ably: {
                                state: import("ably").ConnectionState;
                                errorInfo: import("ably").ErrorInfo;
                                id: string | undefined;
                            };
                            channels: ("chat" | "notifications" | "ai-status" | "user-presence")[];
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}>;
export default websocketPlugin;
