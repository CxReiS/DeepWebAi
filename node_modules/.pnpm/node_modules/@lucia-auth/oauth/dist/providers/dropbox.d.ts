import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
    tokenAccessType?: "online" | "offline";
};
export declare const dropbox: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => DropboxAuth<_Auth>;
export declare class DropboxAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<DropboxUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<DropboxUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class DropboxUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    dropboxTokens: DropboxTokens;
    dropboxUser: DropboxUser;
    constructor(auth: _Auth, dropboxUser: DropboxUser, dropboxTokens: DropboxTokens);
}
export type DropboxTokens = {
    accessToken: string;
    accessTokenExpiresIn: number;
    refreshToken: string | null;
};
export type DropboxUser = PairedDropBoxUser | UnpairedDropboxUser;
type PairedDropBoxUser = BaseDropboxUser & {
    is_paired: true;
    team: {
        id: string;
        name: string;
        office_addin_policy: Record<string, string>;
        sharing_policies: Record<string, Record<string, string>>;
    };
};
type UnpairedDropboxUser = BaseDropboxUser & {
    is_paired: false;
};
type BaseDropboxUser = {
    account_id: string;
    country: string;
    disabled: boolean;
    email: string;
    email_verified: boolean;
    locale: string;
    name: {
        abbreviated_name: string;
        display_name: string;
        familiar_name: string;
        given_name: string;
        surname: string;
    };
    profile_photo_url: string;
};
export {};
