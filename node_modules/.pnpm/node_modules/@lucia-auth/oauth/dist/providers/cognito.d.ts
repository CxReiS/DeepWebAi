import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    userPoolDomain: string;
    redirectUri: string;
    scope?: string[];
};
export declare const cognito: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => CognitoAuth<_Auth>;
export declare class CognitoAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<CognitoUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<CognitoUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class CognitoUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    cognitoTokens: CognitoTokens;
    cognitoUser: CognitoUser;
    constructor(auth: _Auth, cognitoUser: CognitoUser, cognitoTokens: CognitoTokens);
}
export type CognitoTokens = {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    accessTokenExpiresIn: number;
    tokenType: string;
};
export type CognitoUser = {
    sub: string;
    "cognito:username": string;
    "cognito:groups": string[];
    address?: {
        formatted?: string;
    };
    birthdate?: string;
    email?: string;
    email_verified?: boolean;
    family_name?: string;
    gender?: string;
    given_name?: string;
    locale?: string;
    middle_name?: string;
    name?: string;
    nickname?: string;
    phone_number?: string;
    phone_number_verified?: boolean;
    picture?: string;
    preferred_username?: string;
    profile?: string;
    website?: string;
    zoneinfo?: string;
    updated_at?: number;
};
export {};
