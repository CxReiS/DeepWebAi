import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
};
export declare const patreon: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => PatreonAuth<_Auth>;
export declare class PatreonAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<PatreonUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<PatreonUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class PatreonUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    patreonTokens: PatreonTokens;
    patreonUser: PatreonUser;
    constructor(auth: _Auth, patreonUser: PatreonUser, patreonTokens: PatreonTokens);
}
export type PatreonTokens = {
    accessToken: string;
    refreshToken: string | null;
    accessTokenExpiresIn: number;
};
export type PatreonUser = {
    id: string;
    attributes: {
        about: string | null;
        created: string;
        email?: string;
        full_name: string;
        hide_pledges: boolean | null;
        image_url: string;
        is_email_verified: boolean;
        url: string;
    };
};
export {};
