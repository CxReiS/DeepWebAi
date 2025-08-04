import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    scope?: string[];
    redirectUri: string;
};
export declare const twitch: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => TwitchAuth<_Auth>;
export declare class TwitchAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<TwitchUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<TwitchUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class TwitchUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    twitchTokens: TwitchTokens;
    twitchUser: TwitchUser;
    constructor(auth: _Auth, twitchUser: TwitchUser, twitchTokens: TwitchTokens);
}
export type TwitchTokens = {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
};
export type TwitchUser = {
    id: string;
    login: string;
    display_name: string;
    type: "" | "admin" | "staff" | "global_mod";
    broadcaster_type: "" | "affiliate" | "partner";
    description: string;
    profile_image_url: string;
    offline_image_url: string;
    view_count: number;
    email?: string;
    created_at: string;
};
export {};
