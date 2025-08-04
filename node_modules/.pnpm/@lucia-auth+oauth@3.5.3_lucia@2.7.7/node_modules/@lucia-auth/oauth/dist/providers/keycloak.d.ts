import { OAuth2ProviderAuthWithPKCE } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    domain: string;
    realm: string;
    clientId: string;
    clientSecret: string;
    scope?: string[];
    redirectUri?: string;
};
export declare const keycloak: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => KeycloakAuth<_Auth>;
export declare class KeycloakAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuthWithPKCE<KeycloakUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, codeVerifier: string, state: string]>;
    validateCallback: (code: string, code_verifier: string) => Promise<KeycloakUserAuth<_Auth>>;
    private validateAuthorizationCode;
    private claimTokens;
}
export declare class KeycloakUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
    keycloakTokens: KeycloakTokens;
    keycloakUser: KeycloakUser;
    keycloakRoles: KeycloakRole[];
    constructor(auth: _Auth, keycloakUser: KeycloakUser, keycloakTokens: KeycloakTokens, keycloakRoles: KeycloakRole[]);
}
export type KeycloakTokens = {
    accessToken: string;
    accessTokenExpiresIn: number;
    authTime: number;
    issuedAtTime: number;
    expiresAt: number;
    refreshToken: string | null;
    refreshTokenExpiresIn: number | null;
};
export type Claims = {
    exp: number;
    iat: number;
    auth_time: number;
    realm_access: {
        roles: string[];
    };
    resource_access: {
        [key: string]: {
            roles: string[];
        };
    };
};
export type KeycloakUser = {
    exp: number;
    iat: number;
    auth_time: number;
    jti: string;
    iss: string;
    aud: string;
    sub: string;
    typ: string;
    azp: string;
    session_state: string;
    at_hash: string;
    acr: string;
    sid: string;
    email_verified: boolean;
    name: string;
    preferred_username: string;
    given_name: string;
    locale: string;
    family_name: string;
    email: string;
    picture: string;
    user: any;
};
export type KeycloakRole = {
    role_type: "realm" | "resource";
    client: null | string;
    role: string;
};
export {};
