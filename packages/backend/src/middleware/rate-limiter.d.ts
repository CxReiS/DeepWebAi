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

import { Elysia } from "elysia";
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipFailedRequests?: boolean;
    skipSuccessfulRequests?: boolean;
    keyGenerator?: (request: any) => string;
    onLimitReached?: (request: any) => any;
    store?: 'memory' | 'database';
}
export declare function createRateLimiter(config: RateLimitConfig): Elysia<"", {
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
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}, {
    derive: {
        [x: string]: any;
    };
    resolve: {};
    schema: {};
    standaloneSchema: {};
}>;
export declare const apiRateLimit: Elysia<"", {
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
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}, {
    derive: {
        [x: string]: any;
    };
    resolve: {};
    schema: {};
    standaloneSchema: {};
}>;
export declare const authRateLimit: Elysia<"", {
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
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}, {
    derive: {
        [x: string]: any;
    };
    resolve: {};
    schema: {};
    standaloneSchema: {};
}>;
export declare const chatRateLimit: Elysia<"", {
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
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}, {
    derive: {
        [x: string]: any;
    };
    resolve: {};
    schema: {};
    standaloneSchema: {};
}>;
export declare const aiRateLimit: Elysia<"", {
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
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}, {
    derive: {
        [x: string]: any;
    };
    resolve: {};
    schema: {};
    standaloneSchema: {};
}>;
export declare function createQuotaLimiter(quotaType: 'tokens' | 'requests' | 'cost'): Elysia<"", {
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
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}, {
    derive: {
        readonly quotaInfo: null;
        readonly error?: undefined;
        readonly message?: undefined;
        readonly quota?: undefined;
    } | {
        readonly error: "Quota Exceeded";
        readonly message: `tokens quota exceeded for ${any} period.` | `requests quota exceeded for ${any} period.` | `cost quota exceeded for ${any} period.`;
        readonly quota: {
            readonly type: any;
            readonly period: any;
            readonly limit: any;
            readonly used: any;
            readonly resetAt: any;
        };
        readonly quotaInfo?: undefined;
    } | {
        readonly quotaInfo: Record<string, any>[];
        readonly error?: undefined;
        readonly message?: undefined;
        readonly quota?: undefined;
    };
    resolve: {};
    schema: {};
    standaloneSchema: {};
}>;
export declare const smartRateLimit: Elysia<"", {
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
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}, {
    derive: {
        [x: string]: unknown;
    } | {
        code?: any;
        response?: any;
    } | {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}>;
declare const _default: {
    apiRateLimit: Elysia<"", {
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
    }, {}, {
        derive: {};
        resolve: {};
        schema: {};
        standaloneSchema: {};
    }, {
        derive: {
            [x: string]: any;
        };
        resolve: {};
        schema: {};
        standaloneSchema: {};
    }>;
    authRateLimit: Elysia<"", {
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
    }, {}, {
        derive: {};
        resolve: {};
        schema: {};
        standaloneSchema: {};
    }, {
        derive: {
            [x: string]: any;
        };
        resolve: {};
        schema: {};
        standaloneSchema: {};
    }>;
    chatRateLimit: Elysia<"", {
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
    }, {}, {
        derive: {};
        resolve: {};
        schema: {};
        standaloneSchema: {};
    }, {
        derive: {
            [x: string]: any;
        };
        resolve: {};
        schema: {};
        standaloneSchema: {};
    }>;
    aiRateLimit: Elysia<"", {
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
    }, {}, {
        derive: {};
        resolve: {};
        schema: {};
        standaloneSchema: {};
    }, {
        derive: {
            [x: string]: any;
        };
        resolve: {};
        schema: {};
        standaloneSchema: {};
    }>;
    createRateLimiter: typeof createRateLimiter;
    createQuotaLimiter: typeof createQuotaLimiter;
    smartRateLimit: Elysia<"", {
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
    }, {}, {
        derive: {};
        resolve: {};
        schema: {};
        standaloneSchema: {};
    }, {
        derive: {
            [x: string]: unknown;
        } | {
            code?: any;
            response?: any;
        } | {};
        resolve: {};
        schema: {};
        standaloneSchema: {};
    }>;
};
export default _default;
