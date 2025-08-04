import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
};
export declare const facebook: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => FacebookAuth<_Auth>;
export declare class FacebookAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<FacebookUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<FacebookUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class FacebookUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    facebookTokens: FacebookTokens;
    facebookUser: FacebookUser;
    constructor(auth: _Auth, facebookUser: FacebookUser, facebookTokens: FacebookTokens);
}
export type FacebookTokens = {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
};
export type FacebookUser = {
    id: string;
    name: string;
    email?: string;
    picture: {
        data: {
            height: number;
            is_silhouette: boolean;
            url: string;
            width: number;
        };
    };
};
export {};
