import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    redirectUri: string;
    clientId: string;
    teamId: string;
    keyId: string;
    certificate: string;
    responseMode?: "query" | "form_post";
    scope?: string[];
};
export declare const apple: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => AppleAuth<_Auth>;
export declare class AppleAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<AppleUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<AppleUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class AppleUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    appleTokens: AppleTokens;
    appleUser: AppleUser;
    constructor(auth: _Auth, appleUser: AppleUser, appleTokens: AppleTokens);
}
export type AppleTokens = {
    accessToken: string;
    refreshToken: string | null;
    accessTokenExpiresIn: number;
    idToken: string;
};
export type AppleUser = {
    email?: string;
    email_verified?: boolean;
    sub: string;
};
export {};
