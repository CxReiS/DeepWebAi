import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
};
export declare const bitbucket: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => BitbucketAuth<_Auth>;
export declare class BitbucketAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<BitbucketUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<BitbucketUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class BitbucketUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    bitbucketTokens: BitbucketTokens;
    bitbucketUser: BitbucketUser;
    constructor(auth: _Auth, bitbucketUser: BitbucketUser, bitbucketTokens: BitbucketTokens);
}
export type BitbucketTokens = {
    accessToken: string;
    accessTokenExpiresIn: number;
    refreshToken: string;
};
export type BitbucketUser = {
    type: string;
    links: {
        avatar: {} | {
            href: string;
            name: string;
        };
    };
    created_on: string;
    display_name: string;
    username: string;
    uuid: string;
};
export {};
