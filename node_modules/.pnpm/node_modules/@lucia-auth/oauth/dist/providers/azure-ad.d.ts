import { OAuth2ProviderAuthWithPKCE } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    tenant: string;
    redirectUri: string;
    scope?: string[];
};
export declare const azureAD: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => AzureADAuth<_Auth>;
export declare class AzureADAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuthWithPKCE<AzureADUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, codeVerifier: string, state: string]>;
    validateCallback: (code: string, code_verifier: string) => Promise<AzureADUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class AzureADUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    azureADTokens: AzureADTokens;
    azureADUser: AzureADUser;
    constructor(auth: _Auth, azureADUser: AzureADUser, azureADTokens: AzureADTokens);
}
export type AzureADTokens = {
    idToken: string;
    accessToken: string;
    accessTokenExpiresIn: number;
    refreshToken: string | null;
};
export type AzureADUser = {
    sub: string;
    name: string;
    family_name: string;
    given_name: string;
    picture: string;
    email?: string;
};
export {};
