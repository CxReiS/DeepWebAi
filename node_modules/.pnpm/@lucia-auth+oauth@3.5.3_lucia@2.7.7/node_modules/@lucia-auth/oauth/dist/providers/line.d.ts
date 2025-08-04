import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
};
export declare const line: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => LineAuth<_Auth>;
export declare class LineAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<LineUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<LineUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class LineUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    lineTokens: LineTokens;
    lineUser: LineUser;
    constructor(auth: _Auth, lineUser: LineUser, lineTokens: LineTokens);
}
export type LineTokens = {
    accessToken: string;
    accessTokenExpiresIn: number;
    refreshToken: string;
    idToken: string;
};
export type LineUser = {
    userId: string;
    displayName: string;
    pictureUrl: string;
    statusMessage: string;
    email: string | null;
};
export {};
