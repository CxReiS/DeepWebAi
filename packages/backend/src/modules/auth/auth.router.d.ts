import { Elysia } from "elysia";
export declare const userProfileRouter: Elysia<"/user", {
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
    user: {};
} & {
    user: {
        profile: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        error: string;
                        message: string;
                        data?: undefined;
                    } | {
                        success: boolean;
                        data: {
                            user: any;
                        };
                        readonly error?: undefined;
                        readonly message?: undefined;
                    };
                };
            };
        };
    };
} & {
    user: {
        profile: {
            patch: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        error: string;
                        message: string;
                        data?: undefined;
                    } | {
                        success: boolean;
                        message: string;
                        data: {
                            user: any;
                        };
                        readonly error?: undefined;
                    };
                };
            };
        };
    };
} & {
    user: {
        account: {
            delete: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        error: string;
                        message: string;
                    } | {
                        success: boolean;
                        message: string;
                        readonly error?: undefined;
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
export declare const oauthRouter: Elysia<"/oauth", {
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
    oauth: {
        github: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        error: string;
                        message: string;
                        redirect?: undefined;
                    } | {
                        redirect: string;
                        success?: undefined;
                        readonly error?: undefined;
                        readonly message?: undefined;
                    };
                };
            };
        };
    };
} & {
    oauth: {
        github: {
            callback: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            success: boolean;
                            error: string;
                            message: any;
                            data?: undefined;
                        } | {
                            success: boolean;
                            message: string;
                            data: {
                                code: any;
                            };
                            readonly error?: undefined;
                        };
                    };
                };
            };
        };
    };
} & {
    oauth: {
        discord: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        error: string;
                        message: string;
                        redirect?: undefined;
                    } | {
                        redirect: string;
                        success?: undefined;
                        readonly error?: undefined;
                        readonly message?: undefined;
                    };
                };
            };
        };
    };
} & {
    oauth: {
        discord: {
            callback: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            success: boolean;
                            error: string;
                            message: any;
                            data?: undefined;
                        } | {
                            success: boolean;
                            message: string;
                            data: {
                                code: any;
                            };
                            readonly error?: undefined;
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
export declare const adminAuthRouter: Elysia<"/admin", {
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
    admin: {};
} & {
    admin: {
        users: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        data: {
                            users: {
                                id: string;
                                email: string;
                                username: string;
                                role: "user" | "admin" | "developer" | "premium";
                                preferences: Record<string, any>;
                                is_verified: boolean;
                                created_at: Date;
                                updated_at: Date;
                                display_name?: string | undefined;
                                avatar_url?: string | undefined;
                                last_login_at?: Date | undefined;
                                bio?: string | undefined;
                            }[];
                            total: number;
                            limit: number;
                            offset: number;
                        };
                        readonly error?: undefined;
                        readonly message?: undefined;
                    } | {
                        success: boolean;
                        error: string;
                        message: string;
                        data?: undefined;
                    };
                };
            };
        };
    };
} & {
    admin: {
        users: {
            ":id": {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            success: boolean;
                            error: string;
                            message: string;
                            data?: undefined;
                        } | {
                            success: boolean;
                            data: {
                                user: any;
                            };
                            readonly error?: undefined;
                            readonly message?: undefined;
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
    };
} & {
    admin: {
        users: {
            ":id": {
                role: {
                    patch: {
                        body: unknown;
                        params: {
                            id: string;
                        };
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                success: boolean;
                                error: string;
                                message: string;
                                data?: undefined;
                            } | {
                                success: boolean;
                                message: string;
                                data: {
                                    user: any;
                                };
                                readonly error?: undefined;
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
        };
    };
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}, {
    derive: {
        readonly user: any;
    };
    resolve: {};
    schema: {};
    standaloneSchema: {};
}>;
export declare const authRouter: Elysia<"/api", {
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
    };
} & {
    api: {
        user: {};
    } & {
        user: {
            profile: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            success: boolean;
                            error: string;
                            message: string;
                            data?: undefined;
                        } | {
                            success: boolean;
                            data: {
                                user: any;
                            };
                            readonly error?: undefined;
                            readonly message?: undefined;
                        };
                    };
                };
            };
        };
    } & {
        user: {
            profile: {
                patch: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            success: boolean;
                            error: string;
                            message: string;
                            data?: undefined;
                        } | {
                            success: boolean;
                            message: string;
                            data: {
                                user: any;
                            };
                            readonly error?: undefined;
                        };
                    };
                };
            };
        };
    } & {
        user: {
            account: {
                delete: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            success: boolean;
                            error: string;
                            message: string;
                        } | {
                            success: boolean;
                            message: string;
                            readonly error?: undefined;
                        };
                    };
                };
            };
        };
    };
} & {
    api: {
        oauth: {
            github: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            success: boolean;
                            error: string;
                            message: string;
                            redirect?: undefined;
                        } | {
                            redirect: string;
                            success?: undefined;
                            readonly error?: undefined;
                            readonly message?: undefined;
                        };
                    };
                };
            };
        };
    } & {
        oauth: {
            github: {
                callback: {
                    get: {
                        body: unknown;
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                success: boolean;
                                error: string;
                                message: any;
                                data?: undefined;
                            } | {
                                success: boolean;
                                message: string;
                                data: {
                                    code: any;
                                };
                                readonly error?: undefined;
                            };
                        };
                    };
                };
            };
        };
    } & {
        oauth: {
            discord: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            success: boolean;
                            error: string;
                            message: string;
                            redirect?: undefined;
                        } | {
                            redirect: string;
                            success?: undefined;
                            readonly error?: undefined;
                            readonly message?: undefined;
                        };
                    };
                };
            };
        };
    } & {
        oauth: {
            discord: {
                callback: {
                    get: {
                        body: unknown;
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                success: boolean;
                                error: string;
                                message: any;
                                data?: undefined;
                            } | {
                                success: boolean;
                                message: string;
                                data: {
                                    code: any;
                                };
                                readonly error?: undefined;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    api: {
        admin: {};
    } & {
        admin: {
            users: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            success: boolean;
                            data: {
                                users: {
                                    id: string;
                                    email: string;
                                    username: string;
                                    role: "user" | "admin" | "developer" | "premium";
                                    preferences: Record<string, any>;
                                    is_verified: boolean;
                                    created_at: Date;
                                    updated_at: Date;
                                    display_name?: string | undefined;
                                    avatar_url?: string | undefined;
                                    last_login_at?: Date | undefined;
                                    bio?: string | undefined;
                                }[];
                                total: number;
                                limit: number;
                                offset: number;
                            };
                            readonly error?: undefined;
                            readonly message?: undefined;
                        } | {
                            success: boolean;
                            error: string;
                            message: string;
                            data?: undefined;
                        };
                    };
                };
            };
        };
    } & {
        admin: {
            users: {
                ":id": {
                    get: {
                        body: unknown;
                        params: {
                            id: string;
                        };
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                success: boolean;
                                error: string;
                                message: string;
                                data?: undefined;
                            } | {
                                success: boolean;
                                data: {
                                    user: any;
                                };
                                readonly error?: undefined;
                                readonly message?: undefined;
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
        };
    } & {
        admin: {
            users: {
                ":id": {
                    role: {
                        patch: {
                            body: unknown;
                            params: {
                                id: string;
                            };
                            query: unknown;
                            headers: unknown;
                            response: {
                                200: {
                                    success: boolean;
                                    error: string;
                                    message: string;
                                    data?: undefined;
                                } | {
                                    success: boolean;
                                    message: string;
                                    data: {
                                        user: any;
                                    };
                                    readonly error?: undefined;
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
export default authRouter;
