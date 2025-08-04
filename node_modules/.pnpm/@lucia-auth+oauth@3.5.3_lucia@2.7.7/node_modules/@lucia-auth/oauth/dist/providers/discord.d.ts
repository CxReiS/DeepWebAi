import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    scope?: string[];
    redirectUri: string;
};
export declare const discord: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => DiscordAuth<_Auth>;
export declare class DiscordAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<DiscordUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<DiscordUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class DiscordUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    discordTokens: DiscordTokens;
    discordUser: DiscordUser;
    constructor(auth: _Auth, discordUser: DiscordUser, discordTokens: DiscordTokens);
}
export type DiscordTokens = {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
};
export type DiscordUser = {
    id: string;
    username: string;
    discriminator: string;
    global_name: string | null;
    avatar: string | null;
    bot?: boolean;
    system?: boolean;
    mfa_enabled?: boolean;
    verified?: boolean;
    email?: string | null;
    flags?: number;
    banner?: string | null;
    accent_color?: number | null;
    premium_type?: number;
    public_flags?: number;
    locale?: string;
    avatar_decoration?: string | null;
};
export {};
