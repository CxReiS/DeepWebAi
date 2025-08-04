import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
    accessType?: "online" | "offline";
};
export declare const google: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => GoogleAuth<_Auth>;
export declare class GoogleAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<GoogleUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<GoogleUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class GoogleUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    googleTokens: GoogleTokens;
    googleUser: GoogleUser;
    constructor(auth: _Auth, googleUser: GoogleUser, googleTokens: GoogleTokens);
}
export type GoogleTokens = {
    accessToken: string;
    refreshToken: string | null;
    accessTokenExpiresIn: number;
};
export type GoogleUser = {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
    email?: string;
    email_verified?: boolean;
    hd?: string;
};
export {};
