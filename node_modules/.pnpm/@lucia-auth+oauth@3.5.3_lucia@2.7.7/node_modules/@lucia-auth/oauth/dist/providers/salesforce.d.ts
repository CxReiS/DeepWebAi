import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
};
export declare const salesforce: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => SalesforceAuth<_Auth>;
export declare class SalesforceAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<SalesforceUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<SalesforceUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class SalesforceUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    salesforceTokens: SalesforceTokens;
    salesforceUser: SalesforceUser;
    constructor(auth: _Auth, salesforceUser: SalesforceUser, salesforceTokens: SalesforceTokens);
}
export type SalesforceTokens = {
    accessToken: string;
    idToken: string;
    refreshToken: string | null;
};
export type SalesforceUser = {
    sub: string;
    user_id: string;
    organization_id: string;
    name: string;
    email?: string;
    email_verified: boolean;
    given_name: string;
    family_name: string;
    zoneinfo: string;
    photos: {
        picture: string;
        thumbnail: string;
    };
    profile: string;
    picture: string;
    address?: Record<string, string>;
    urls: Record<string, string>;
    active: boolean;
    user_type: string;
    language: string;
    locale: string;
    utcOffset: number;
    updated_at: string;
};
export {};
