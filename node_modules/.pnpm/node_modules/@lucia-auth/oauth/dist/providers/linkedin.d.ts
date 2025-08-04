import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
};
export declare const linkedIn: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => LinkedInAuth<_Auth>;
export declare class LinkedInAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<LinkedInUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<LinkedInUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class LinkedInUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    linkedInTokens: LinkedInTokens;
    linkedInUser: LinkedInUser;
    constructor(auth: _Auth, linkedInUser: LinkedInUser, linkedInTokens: LinkedInTokens);
}
export type LinkedInTokens = {
    accessToken: string;
    accessTokenExpiresIn: number;
    refreshToken: string;
    refreshTokenExpiresIn: number;
    scope: string;
};
export type LinkedInUser = {
    sub: string;
    name: string;
    email: string;
    email_verified: boolean;
    given_name: string;
    family_name: string;
    locale: {
        country: string;
        language: string;
    };
    picture: string;
};
export {};
