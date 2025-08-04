import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
};
export declare const spotify: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => SpotifyAuth<_Auth>;
export declare class SpotifyAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<SpotifyUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<SpotifyUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class SpotifyUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    spotifyTokens: SpotifyTokens;
    spotifyUser: SpotifyUser;
    constructor(auth: _Auth, spotifyUser: SpotifyUser, spotifyTokens: SpotifyTokens);
}
export type SpotifyTokens = {
    accessToken: string;
    tokenType: string;
    scope: string;
    accessTokenExpiresIn: number;
    refreshToken: string;
};
export type SpotifyUser = {
    country?: string;
    display_name: string | null;
    email?: string;
    explicit_content: {
        filter_enabled?: boolean;
        filter_locked?: boolean;
    };
    external_urls: {
        spotify: string;
    };
    followers: {
        href: string | null;
        total: number;
    };
    href: string;
    id: string;
    images: [
        {
            url: string;
            height: number | null;
            width: number | null;
        }
    ];
    product?: string;
    type: string;
    uri: string;
};
export {};
