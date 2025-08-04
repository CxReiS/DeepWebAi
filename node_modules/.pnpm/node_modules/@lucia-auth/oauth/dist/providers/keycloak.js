import { OAuth2ProviderAuthWithPKCE, createOAuth2AuthorizationUrlWithPKCE, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { decodeIdToken } from "../index.js";
import { handleRequest, authorizationHeader, originFromDomain } from "../utils/request.js";
const PROVIDER_ID = "keycloak";
export const keycloak = (auth, config) => {
    return new KeycloakAuth(auth, config);
};
export class KeycloakAuth extends OAuth2ProviderAuthWithPKCE {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        return await createOAuth2AuthorizationUrlWithPKCE(new URL(`/realms/${this.config.realm}/protocol/openid-connect/auth`, originFromDomain(this.config.domain)), {
            clientId: this.config.clientId,
            scope: ["profile", "openid", ...scopeConfig],
            redirectUri: this.config.redirectUri,
            codeChallengeMethod: "S256"
        });
    };
    validateCallback = async (code, code_verifier) => {
        const keycloakTokens = await this.validateAuthorizationCode(code, code_verifier);
        const keycloakUser = await getKeycloakUser(this.config.domain, this.config.realm, keycloakTokens.accessToken);
        const keycloakRoles = getKeycloakRoles(keycloakTokens.accessToken);
        return new KeycloakUserAuth(this.auth, keycloakUser, keycloakTokens, keycloakRoles);
    };
    validateAuthorizationCode = async (code, codeVerifier) => {
        const rawTokens = await validateOAuth2AuthorizationCode(code, new URL(`/realms/${this.config.realm}/protocol/openid-connect/token`, originFromDomain(this.config.domain)), {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            codeVerifier,
            clientPassword: {
                authenticateWith: "http_basic_auth",
                clientSecret: this.config.clientSecret
            }
        });
        return this.claimTokens(rawTokens);
    };
    claimTokens = (tokens) => {
        if ("refresh_token" in tokens) {
            return {
                accessToken: tokens.access_token,
                accessTokenExpiresIn: tokens.expires_in,
                authTime: tokens.auth_time,
                issuedAtTime: tokens.issued_at_time,
                expiresAt: tokens.expires_at,
                refreshToken: tokens.refresh_token,
                refreshTokenExpiresIn: tokens.refresh_expires_in
            };
        }
        return {
            accessToken: tokens.access_token,
            accessTokenExpiresIn: tokens.expires_in,
            authTime: tokens.auth_time,
            issuedAtTime: tokens.issued_at_time,
            expiresAt: tokens.expires_at,
            refreshToken: null,
            refreshTokenExpiresIn: null
        };
    };
}
const getKeycloakUser = async (domain, realm, accessToken) => {
    const keycloakUserRequest = new Request(new URL(`/realms/${realm}/protocol/openid-connect/userinfo`, originFromDomain(domain)), {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    return await handleRequest(keycloakUserRequest);
};
const getKeycloakRoles = (accessToken) => {
    const tokenDecoded = decodeIdToken(accessToken);
    const keycloakRoles = [];
    if ("realm_access" in tokenDecoded) {
        for (const role of tokenDecoded.realm_access.roles) {
            keycloakRoles.push({
                role_type: "realm",
                client: null,
                role: role
            });
        }
    }
    if ("resource_access" in tokenDecoded) {
        for (const [key, client] of Object.entries(tokenDecoded.resource_access)) {
            for (const role of client.roles) {
                keycloakRoles.push({
                    role_type: "resource",
                    client: key,
                    role: role
                });
            }
        }
    }
    return keycloakRoles;
};
export class KeycloakUserAuth extends ProviderUserAuth {
    keycloakTokens;
    keycloakUser;
    keycloakRoles;
    constructor(auth, keycloakUser, keycloakTokens, keycloakRoles) {
        super(auth, PROVIDER_ID, keycloakUser.sub);
        this.keycloakTokens = keycloakTokens;
        this.keycloakUser = keycloakUser;
        this.keycloakRoles = keycloakRoles;
    }
}
