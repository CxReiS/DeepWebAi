import { OAuth2ProviderAuthWithPKCE } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    redirectUri: string;
    scope?: string[];
};
export declare const lichess: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => LichessAuth<_Auth>;
export declare class LichessAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuthWithPKCE<LichessUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, codeVerifier: string, state: string]>;
    validateCallback: (code: string, code_verifier: string) => Promise<LichessUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class LichessUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    lichessTokens: LichessTokens;
    lichessUser: LichessUser;
    constructor(auth: _Auth, lichessUser: LichessUser, lichessTokens: LichessTokens);
}
export type LichessTokens = {
    accessToken: string;
    accessTokenExpiresIn: number;
};
export type LichessUser = {
    id: string;
    username: string;
};
export {};
