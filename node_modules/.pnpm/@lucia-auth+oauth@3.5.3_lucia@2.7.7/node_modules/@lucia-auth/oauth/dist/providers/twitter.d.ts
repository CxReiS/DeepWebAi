import { OAuth2ProviderAuthWithPKCE } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
};
export declare const twitter: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => TwitterAuth<_Auth>;
export declare class TwitterAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuthWithPKCE<TwitterUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, codeVerifier: string, state: string]>;
    validateCallback: (code: string, code_verifier: string) => Promise<TwitterUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class TwitterUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    twitterTokens: TwitterTokens;
    twitterUser: TwitterUser;
    constructor(auth: _Auth, twitterUser: TwitterUser, twitterTokens: TwitterTokens);
}
export type TwitterTokens = {
    accessToken: string;
    refreshToken: string | null;
};
export type TwitterUser = {
    id: string;
    name: string;
    username: string;
};
export {};
