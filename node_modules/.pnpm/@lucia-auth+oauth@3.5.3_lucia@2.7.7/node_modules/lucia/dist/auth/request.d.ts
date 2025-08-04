import type { Auth, Env, Session } from "./index.js";
import type { Cookie } from "./cookie.js";
export type LuciaRequest = {
    method: string;
    url?: string;
    headers: Pick<Headers, "get">;
};
export type RequestContext = {
    sessionCookie?: string | null;
    request: LuciaRequest;
    setCookie: (cookie: Cookie) => void;
};
export type Middleware<Args extends any[] = any> = (context: {
    args: Args;
    env: Env;
    sessionCookieName: string;
}) => MiddlewareRequestContext;
type MiddlewareRequestContext = Omit<RequestContext, "request"> & {
    sessionCookie?: string | null;
    request: {
        method: string;
        url?: string;
        headers: Pick<Headers, "get"> | {
            origin: string | null;
            cookie: string | null;
            authorization: string | null;
        };
        storedSessionCookie?: string | null;
    };
    setCookie: (cookie: Cookie) => void;
};
export type CSRFProtectionConfiguration = {
    host?: string;
    hostHeader?: string;
    allowedSubDomains?: string[] | "*";
};
export declare class AuthRequest<_Auth extends Auth = any> {
    private auth;
    private requestContext;
    constructor(auth: _Auth, config: {
        requestContext: RequestContext;
        csrfProtection: boolean | CSRFProtectionConfiguration;
    });
    private validatePromise;
    private validateBearerTokenPromise;
    private storedSessionId;
    private bearerToken;
    setSession: (session: Session | null) => void;
    private maybeSetSession;
    private setSessionCookie;
    validate: () => Promise<Session | null>;
    validateBearerToken: () => Promise<Session | null>;
    invalidate(): void;
    private isValidRequestOrigin;
}
export declare const transformRequestContext: ({ request, setCookie, sessionCookie }: MiddlewareRequestContext) => RequestContext;
export {};
