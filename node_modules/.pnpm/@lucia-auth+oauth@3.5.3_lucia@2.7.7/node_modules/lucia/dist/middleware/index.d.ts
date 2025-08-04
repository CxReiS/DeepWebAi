import type { CookieAttributes } from "../utils/cookie.js";
import type { Middleware, RequestContext } from "../auth/request.js";
type NodeIncomingMessage = {
    method?: string;
    headers: Record<string, string | string[] | undefined>;
};
type NodeOutGoingMessage = {
    getHeader: (name: string) => string | string[] | number | undefined;
    setHeader: (name: string, value: string | number | readonly string[]) => void;
};
export declare const node: () => Middleware<[
    NodeIncomingMessage,
    NodeOutGoingMessage
]>;
type ExpressRequest = {
    method: string;
    headers: Record<string, string | string[] | undefined>;
};
type ExpressResponse = {
    cookie: (name: string, val: string, options?: CookieAttributes) => void;
};
export declare const express: () => Middleware<[ExpressRequest, ExpressResponse]>;
type FastifyRequest = {
    method: string;
    headers: Record<string, string | string[] | undefined>;
};
type FastifyReply = {
    header: (name: string, val: any) => void;
};
export declare const fastify: () => Middleware<[FastifyRequest, FastifyReply]>;
type SvelteKitRequestEvent = {
    request: Request;
    cookies: {
        set: (name: string, value: string, options: CookieAttributes & {
            path: string;
        }) => void;
        get: (name: string) => string | undefined;
    };
};
export declare const sveltekit: () => Middleware<[SvelteKitRequestEvent]>;
type AstroAPIContext = {
    request: Request;
    cookies: {
        set: (name: string, value: string, options?: CookieAttributes) => void;
        get: (name: string) => {
            value: string | undefined;
        } | undefined;
    };
};
export declare const astro: () => Middleware<[AstroAPIContext]>;
type QwikRequestEvent = {
    request: Request;
    cookie: {
        set: (name: string, value: string, options?: CookieAttributes) => void;
        get: (key: string) => {
            value: string;
        } | null;
    };
};
export declare const qwik: () => Middleware<[QwikRequestEvent]>;
type ElysiaContext = {
    request: Request;
    set: {
        headers: Record<string, string> & {
            ["Set-Cookie"]?: string | string[];
        };
    };
};
export declare const elysia: () => Middleware<[ElysiaContext]>;
export declare const lucia: () => Middleware<[RequestContext]>;
export declare const web: () => Middleware<[Request]>;
type NextJsPagesServerContext = {
    req: NodeIncomingMessage;
    res?: NodeOutGoingMessage;
};
type NextCookie = {
    name: string;
    value: string;
} | undefined;
type NextCookiesFunction = () => {
    set: (name: string, value: string, options: CookieAttributes) => void;
    get: (name: string) => NextCookie;
};
type NextHeadersFunction = () => {
    get: (name: string) => string | null;
};
type NextRequest = Request & {
    cookies: {
        get: (name: string) => NextCookie;
    };
};
type NextJsAppServerContext = {
    cookies: NextCookiesFunction;
    request: NextRequest | null;
};
export declare const nextjs: () => Middleware<[
    NextJsPagesServerContext | NextJsAppServerContext | NextRequest
]>;
type NextJsAppServerContext_V3 = {
    headers: NextHeadersFunction;
    cookies: NextCookiesFunction;
};
export declare const nextjs_future: () => Middleware<[NextJsPagesServerContext] | [NextRequest] | [requestMethod: string, context: NextJsAppServerContext_V3]>;
type H3Event = {
    node: {
        req: NodeIncomingMessage;
        res: NodeOutGoingMessage;
    };
};
export declare const h3: () => Middleware<[H3Event]>;
type HonoContext = {
    req: {
        url: string;
        method: string;
        headers: Headers;
    };
    header: (name: string, value: string) => void;
};
export declare const hono: () => Middleware<[HonoContext]>;
export {};
