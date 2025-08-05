import { Elysia } from "elysia";
export declare const authController: Elysia<"/auth", {
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
    auth: {};
} & {
    auth: {
        register: {
            post: {
                body: {
                    displayName?: string | undefined;
                    preferences?: {} | undefined;
                    email: string;
                    username: string;
                    password: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        message: string;
                        data: {
                            user: any;
                            token: string;
                            sessionId: any;
                        };
                        readonly error?: undefined;
                    } | {
                        success: boolean;
                        error: string;
                        message: any;
                        data?: undefined;
                    };
                    readonly 201: {
                        message: string;
                        success: boolean;
                        data: {
                            user: {
                                id: string;
                                email: string;
                                username: string;
                                displayName: string;
                                role: string;
                                isVerified: boolean;
                            };
                            sessionId: string;
                            token: string;
                        };
                    };
                    readonly 400: {
                        error: string;
                        message: string;
                        success: boolean;
                    };
                    readonly 409: {
                        error: string;
                        message: string;
                        success: boolean;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    auth: {
        login: {
            post: {
                body: {
                    email: string;
                    password: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message: string;
                        success: boolean;
                        data: {
                            user: {
                                id: string;
                                email: string;
                                username: string;
                                displayName: string;
                                role: string;
                                isVerified: boolean;
                            };
                            sessionId: string;
                            token: string;
                        };
                    };
                    readonly 401: {
                        error: string;
                        message: string;
                        success: boolean;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    auth: {
        logout: {
            post: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message: string;
                        success: boolean;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    auth: {
        me: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        data: {
                            session: {
                                id: string;
                                expiresAt: Date;
                            };
                            user: {
                                id: string;
                                email: string;
                                username: string;
                                displayName: string;
                                role: string;
                                isVerified: boolean;
                            };
                        };
                    };
                    readonly 401: {
                        error: string;
                        message: string;
                        success: boolean;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    auth: {
        "change-password": {
            post: {
                body: {
                    currentPassword: string;
                    newPassword: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message: string;
                        success: boolean;
                    };
                    readonly 400: {
                        error: string;
                        message: string;
                        success: boolean;
                    };
                    readonly 401: {
                        error: string;
                        message: string;
                        success: boolean;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    auth: {
        refresh: {
            post: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        message: string;
                        success: boolean;
                        data: {
                            user: {
                                id: string;
                                email: string;
                                username: string;
                                displayName: string;
                                role: string;
                            };
                            sessionId: string;
                            token: string;
                        };
                    };
                    readonly 401: {
                        error: string;
                        message: string;
                        success: boolean;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
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
export default authController;
