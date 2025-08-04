import type { ProviderUserAuth } from "./provider.js";
export declare abstract class OAuth2ProviderAuth<_ProviderUserAuth extends ProviderUserAuth = ProviderUserAuth, _Auth = _ProviderUserAuth extends ProviderUserAuth<infer _Auth> ? _Auth : never> {
    protected auth: _Auth;
    constructor(auth: _Auth);
    abstract validateCallback: (code: string) => Promise<_ProviderUserAuth>;
    abstract getAuthorizationUrl: () => Promise<readonly [url: URL, state: string | null]>;
}
export declare abstract class OAuth2ProviderAuthWithPKCE<_ProviderUserAuth extends ProviderUserAuth = ProviderUserAuth, _Auth = _ProviderUserAuth extends ProviderUserAuth<infer _Auth> ? _Auth : never> {
    protected auth: _Auth;
    constructor(auth: _Auth);
    abstract validateCallback: (code: string, codeVerifier: string) => Promise<_ProviderUserAuth>;
    abstract getAuthorizationUrl: () => Promise<readonly [url: URL, codeVerifier: string, state: string | null]>;
}
export declare const createOAuth2AuthorizationUrl: (url: string | URL, options: {
    clientId: string;
    scope: string[];
    redirectUri?: string;
}) => Promise<readonly [authorizationUrl: URL, state: string]>;
export declare const createOAuth2AuthorizationUrlWithPKCE: (url: string | URL, options: {
    clientId: string;
    scope: string[];
    codeChallengeMethod: "S256";
    redirectUri?: string;
}) => Promise<readonly [authorizationUrl: URL, codeVerifier: string, state: string]>;
export declare const validateOAuth2AuthorizationCode: <_ResponseBody extends {}>(authorizationCode: string, url: string | URL, options: {
    clientId: string;
    redirectUri?: string;
    codeVerifier?: string;
    clientPassword?: {
        clientSecret: string;
        authenticateWith: "client_secret" | "http_basic_auth";
    };
}) => Promise<_ResponseBody>;
export declare const generateState: () => string;
export declare const generatePKCECodeChallenge: (method: "S256", verifier: string) => Promise<string>;
