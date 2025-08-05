import { Elysia } from 'elysia';
import { z } from 'zod';
export declare const featureFlagsRouter: Elysia<"", {
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
        "feature-flags": {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        userId?: undefined;
                        features?: undefined;
                        timestamp?: undefined;
                    } | {
                        userId: string;
                        features: Record<string, boolean>;
                        timestamp: string;
                        readonly error?: undefined;
                    };
                };
            };
        };
    };
} & {
    api: {
        "feature-flags": {
            ":flagName": {
                get: {
                    body: unknown;
                    params: {
                        flagName: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            flagName?: undefined;
                            isEnabled?: undefined;
                            userId?: undefined;
                            timestamp?: undefined;
                        } | {
                            flagName: string;
                            isEnabled: boolean;
                            userId: string;
                            timestamp: string;
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
} & {
    api: {
        "feature-flags": {
            track: {
                post: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            details: z.ZodIssue[];
                            success?: undefined;
                            timestamp?: undefined;
                        } | {
                            success: boolean;
                            timestamp: string;
                            readonly error?: undefined;
                            details?: undefined;
                        } | {
                            error: string;
                            details?: undefined;
                            success?: undefined;
                            timestamp?: undefined;
                        };
                    };
                };
            };
        };
    };
} & {
    api: {
        admin: {
            "feature-flags": {
                post: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            details?: undefined;
                            success?: undefined;
                            flag?: undefined;
                        } | {
                            error: string;
                            details: z.ZodIssue[];
                            success?: undefined;
                            flag?: undefined;
                        } | {
                            success: boolean;
                            flag: {
                                name: string;
                                environment: "all" | "production" | "development" | "staging";
                                isEnabled: boolean;
                                conditions: Record<string, any>;
                                rolloutPercentage: number;
                                targetGroups: string[];
                                description?: string | undefined;
                            };
                            readonly error?: undefined;
                            details?: undefined;
                        };
                    };
                };
            };
        };
    };
} & {
    api: {
        "feature-flags": {
            health: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            status: string;
                            provider: string;
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
