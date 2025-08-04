import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
};
export declare const atlassian: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => AtlassianAuth<_Auth>;
export declare class AtlassianAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<AtlassianUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<AtlassianUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class AtlassianUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    atlassianTokens: AtlassianTokens;
    atlassianUser: AtlassianUser;
    constructor(auth: _Auth, atlassianUser: AtlassianUser, atlassianTokens: AtlassianTokens);
}
export type AtlassianTokens = {
    accessToken: string;
    accessTokenExpiresIn: number;
    refreshToken: string | null;
};
export type AtlassianUser = {
    account_type: string;
    account_id: string;
    email: string;
    name: string;
    picture: string;
    account_status: string;
    nickname: string;
    zoneinfo: string;
    locale: string;
    extended_profile?: Record<string, string>;
};
export {};
