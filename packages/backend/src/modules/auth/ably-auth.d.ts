import { Elysia } from 'elysia';
import * as Ably from 'ably';
export declare const ablyAuthRouter: Elysia<"", {
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
    api: {
        auth: {
            "ably-token": {
                post: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: Ably.TokenRequest | {
                            error: string;
                        };
                    };
                };
            };
        };
    };
} & {
    api: {
        auth: {
            "ably-token": {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: Ably.TokenRequest | {
                            error: string;
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
