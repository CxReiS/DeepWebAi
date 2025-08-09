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
export declare const securityHeaders: {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: string[];
            scriptSrc: string[];
            styleSrc: string[];
            fontSrc: string[];
            imgSrc: string[];
            connectSrc: string[];
            mediaSrc: string[];
            objectSrc: string[];
            childSrc: string[];
            workerSrc: string[];
            frameSrc: string[];
            formAction: string[];
            upgradeInsecureRequests: never[] | undefined;
        };
    };
    strictTransportSecurity: {
        maxAge: number;
        includeSubDomains: boolean;
        preload: boolean;
    };
    frameguard: {
        action: string;
    };
    noSniff: boolean;
    xssFilter: boolean;
    referrerPolicy: {
        policy: string;
    };
    permissionsPolicy: {
        camera: never[];
        microphone: never[];
        geolocation: never[];
        payment: never[];
        usb: never[];
        magnetometer: never[];
        accelerometer: never[];
        gyroscope: never[];
    };
};
export declare const securityMiddleware: Elysia<"", any, any, any, any, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}, {
    derive: any;
    resolve: any;
    schema: any;
    standaloneSchema: any;
}>;
export declare const apiSecurityMiddleware: Elysia<"", {
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
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}>;
export declare const inputSecurityMiddleware: Elysia<"", {
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
        readonly error: "Payload Too Large";
        readonly message: `Request body size ${number} exceeds limit of ${number} bytes`;
    } | {
        readonly error: "Invalid Input";
        readonly message: "Request contains potentially malicious content";
    } | {
        readonly error?: undefined;
        readonly message?: undefined;
    };
    resolve: {};
    schema: {};
    standaloneSchema: {};
}>;
export declare const authSecurityMiddleware: Elysia<"", {
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
        readonly authAttempt: {
            readonly ip: any;
            readonly userAgent: any;
            readonly timestamp: string;
        };
    };
    resolve: {};
    schema: {};
    standaloneSchema: {};
}>;
export declare const fileUploadSecurityMiddleware: Elysia<"", {
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
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}>;
declare const _default: {
    securityMiddleware: Elysia<"", any, any, any, any, {
        derive: {};
        resolve: {};
        schema: {};
        standaloneSchema: {};
    }, {
        derive: any;
        resolve: any;
        schema: any;
        standaloneSchema: any;
    }>;
    apiSecurityMiddleware: Elysia<"", {
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
        derive: {};
        resolve: {};
        schema: {};
        standaloneSchema: {};
    }>;
    inputSecurityMiddleware: Elysia<"", {
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
            readonly error: "Payload Too Large";
            readonly message: `Request body size ${number} exceeds limit of ${number} bytes`;
        } | {
            readonly error: "Invalid Input";
            readonly message: "Request contains potentially malicious content";
        } | {
            readonly error?: undefined;
            readonly message?: undefined;
        };
        resolve: {};
        schema: {};
        standaloneSchema: {};
    }>;
    authSecurityMiddleware: Elysia<"", {
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
            readonly authAttempt: {
                readonly ip: any;
                readonly userAgent: any;
                readonly timestamp: string;
            };
        };
        resolve: {};
        schema: {};
        standaloneSchema: {};
    }>;
    fileUploadSecurityMiddleware: Elysia<"", {
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
        derive: {};
        resolve: {};
        schema: {};
        standaloneSchema: {};
    }>;
    securityHeaders: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: string[];
                scriptSrc: string[];
                styleSrc: string[];
                fontSrc: string[];
                imgSrc: string[];
                connectSrc: string[];
                mediaSrc: string[];
                objectSrc: string[];
                childSrc: string[];
                workerSrc: string[];
                frameSrc: string[];
                formAction: string[];
                upgradeInsecureRequests: never[] | undefined;
            };
        };
        strictTransportSecurity: {
            maxAge: number;
            includeSubDomains: boolean;
            preload: boolean;
        };
        frameguard: {
            action: string;
        };
        noSniff: boolean;
        xssFilter: boolean;
        referrerPolicy: {
            policy: string;
        };
        permissionsPolicy: {
            camera: never[];
            microphone: never[];
            geolocation: never[];
            payment: never[];
            usb: never[];
            magnetometer: never[];
            accelerometer: never[];
            gyroscope: never[];
        };
    };
};
export default _default;
