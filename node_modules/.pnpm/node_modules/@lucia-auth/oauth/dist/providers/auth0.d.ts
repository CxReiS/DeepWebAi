import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    appDomain: string;
    redirectUri: string;
    scope?: string[];
};
export declare const auth0: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => Auth0Auth<_Auth>;
export declare class Auth0Auth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<Auth0UserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<Auth0UserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class Auth0UserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    auth0Tokens: Auth0Tokens;
    auth0User: Auth0User;
    constructor(auth: _Auth, auth0User: Auth0User, auth0Tokens: Auth0Tokens);
}
export type Auth0Tokens = {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    tokenType: string;
};
export type Auth0User = {
    id: string;
    sub: string;
    name: string;
    picture: string;
    locale: string;
    updated_at: string;
    given_name?: string;
    family_name?: string;
    middle_name?: string;
    nickname?: string;
    preferred_username?: string;
    profile?: string;
    email?: string;
    email_verified?: boolean;
    gender?: string;
    birthdate?: string;
    zoneinfo?: string;
    phone_number?: string;
    phone_number_verified?: boolean;
};
export {};
