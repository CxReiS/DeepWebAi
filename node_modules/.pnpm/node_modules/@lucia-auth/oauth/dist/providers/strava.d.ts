import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    scope?: string[];
    redirectUri?: string;
};
export declare const strava: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => StravaAuth<_Auth>;
export declare class StravaAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<StravaUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<StravaUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class StravaUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
    stravaTokens: StravaTokens;
    stravaUser: StravaUser;
    constructor(auth: _Auth, stravaUser: StravaUser, stravaTokens: StravaTokens);
}
export type StravaTokens = {
    accessToken: string;
} | {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
};
export type StravaUser = {
    id: number;
    username: string;
    resource_state: number;
    firstname: string;
    lastname: string;
    bio: string;
    city: string;
    country: string;
    sex: string;
    premium: boolean;
    summit: boolean;
    created_at: string;
    updated_at: string;
    badge_type_id: number;
    weight: number;
    profile_medium: string;
    profile: string;
};
export {};
