import { debug } from "../utils/debug.js";
import { LuciaError } from "./error.js";
import { createHeadersFromObject } from "../utils/request.js";
import { isAllowedOrigin, safeParseUrl } from "../utils/url.js";
export class AuthRequest {
    auth;
    requestContext;
    constructor(auth, config) {
        debug.request.init(config.requestContext.request.method, config.requestContext.request.url ?? "(url unknown)");
        this.auth = auth;
        this.requestContext = config.requestContext;
        const csrfProtectionConfig = typeof config.csrfProtection === "object" ? config.csrfProtection : {};
        const csrfProtectionEnabled = config.csrfProtection !== false;
        if (!csrfProtectionEnabled ||
            this.isValidRequestOrigin(csrfProtectionConfig)) {
            this.storedSessionId =
                this.requestContext.sessionCookie ??
                    auth.readSessionCookie(this.requestContext.request.headers.get("Cookie"));
        }
        else {
            this.storedSessionId = null;
        }
        this.bearerToken = auth.readBearerToken(this.requestContext.request.headers.get("Authorization"));
    }
    validatePromise = null;
    validateBearerTokenPromise = null;
    storedSessionId;
    bearerToken;
    setSession = (session) => {
        const sessionId = session?.sessionId ?? null;
        if (this.storedSessionId === sessionId)
            return;
        this.validatePromise = null;
        this.setSessionCookie(session);
    };
    maybeSetSession = (session) => {
        try {
            this.setSession(session);
        }
        catch {
            // ignore error
            // some middleware throw error
        }
    };
    setSessionCookie = (session) => {
        const sessionId = session?.sessionId ?? null;
        if (this.storedSessionId === sessionId)
            return;
        this.storedSessionId = sessionId;
        this.requestContext.setCookie(this.auth.createSessionCookie(session));
        if (session) {
            debug.request.notice("Session cookie stored", session.sessionId);
        }
        else {
            debug.request.notice("Session cookie deleted");
        }
    };
    validate = async () => {
        if (this.validatePromise) {
            debug.request.info("Using cached result for session validation");
            return this.validatePromise;
        }
        this.validatePromise = new Promise(async (resolve, reject) => {
            if (!this.storedSessionId)
                return resolve(null);
            try {
                const session = await this.auth.validateSession(this.storedSessionId);
                if (session.fresh) {
                    this.maybeSetSession(session);
                }
                return resolve(session);
            }
            catch (e) {
                if (e instanceof LuciaError &&
                    e.message === "AUTH_INVALID_SESSION_ID") {
                    this.maybeSetSession(null);
                    return resolve(null);
                }
                return reject(e);
            }
        });
        return await this.validatePromise;
    };
    validateBearerToken = async () => {
        if (this.validateBearerTokenPromise) {
            debug.request.info("Using cached result for bearer token validation");
            return this.validatePromise;
        }
        this.validatePromise = new Promise(async (resolve, reject) => {
            if (!this.bearerToken)
                return resolve(null);
            try {
                const session = await this.auth.validateSession(this.bearerToken);
                return resolve(session);
            }
            catch (e) {
                if (e instanceof LuciaError) {
                    return resolve(null);
                }
                return reject(e);
            }
        });
        return await this.validatePromise;
    };
    invalidate() {
        this.validatePromise = null;
        this.validateBearerTokenPromise = null;
    }
    isValidRequestOrigin = (config) => {
        const request = this.requestContext.request;
        const whitelist = ["GET", "HEAD", "OPTIONS", "TRACE"];
        if (whitelist.some((val) => val === request.method.toUpperCase())) {
            return true;
        }
        const requestOrigin = request.headers.get("Origin");
        if (!requestOrigin) {
            debug.request.fail("No request origin available");
            return false;
        }
        let host = null;
        if (config.host !== undefined) {
            host = config.host ?? null;
        }
        else if (request.url !== null && request.url !== undefined) {
            host = safeParseUrl(request.url)?.host ?? null;
        }
        else {
            host = request.headers.get(config.hostHeader ?? "Host");
        }
        debug.request.info("Host", host ?? "(Host unknown)");
        if (host !== null &&
            isAllowedOrigin(requestOrigin, host, config.allowedSubDomains ?? [])) {
            debug.request.info("Valid request origin", requestOrigin);
            return true;
        }
        debug.request.info("Invalid request origin", requestOrigin);
        return false;
    };
}
export const transformRequestContext = ({ request, setCookie, sessionCookie }) => {
    return {
        request: {
            url: request.url,
            method: request.method,
            headers: "authorization" in request.headers
                ? createHeadersFromObject(request.headers)
                : request.headers
        },
        setCookie,
        sessionCookie: sessionCookie ?? request.storedSessionCookie
    };
};
