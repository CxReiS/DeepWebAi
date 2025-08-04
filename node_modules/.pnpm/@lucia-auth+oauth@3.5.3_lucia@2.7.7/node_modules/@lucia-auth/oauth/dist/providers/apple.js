import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { decodeIdToken } from "../core/oidc.js";
import { getPKCS8Key } from "../utils/crypto.js";
import { createES256SignedJWT } from "../utils/jwt.js";
const PROVIDER_ID = "apple";
const APPLE_AUD = "https://appleid.apple.com";
export const apple = (auth, config) => {
    return new AppleAuth(auth, config);
};
export class AppleAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        const [url, state] = await createOAuth2AuthorizationUrl("https://appleid.apple.com/auth/authorize", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scope: scopeConfig
        });
        url.searchParams.set("response_mode", this.config.responseMode ?? "query");
        return [url, state];
    };
    validateCallback = async (code) => {
        const appleTokens = await this.validateAuthorizationCode(code);
        const idTokenPayload = decodeIdToken(appleTokens.idToken);
        const appleUser = {
            sub: idTokenPayload.sub,
            email: idTokenPayload.email,
            email_verified: idTokenPayload.email_verified
        };
        return new AppleUserAuth(this.auth, appleUser, appleTokens);
    };
    validateAuthorizationCode = async (code) => {
        const clientSecret = await createSecretId({
            certificate: this.config.certificate,
            teamId: this.config.teamId,
            clientId: this.config.clientId,
            keyId: this.config.keyId
        });
        const tokens = await validateOAuth2AuthorizationCode(code, "https://appleid.apple.com/auth/token", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            clientPassword: {
                clientSecret,
                authenticateWith: "client_secret"
            }
        });
        return {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? null,
            accessTokenExpiresIn: tokens.expires_in,
            idToken: tokens.id_token
        };
    };
}
export class AppleUserAuth extends ProviderUserAuth {
    appleTokens;
    appleUser;
    constructor(auth, appleUser, appleTokens) {
        super(auth, PROVIDER_ID, appleUser.sub);
        this.appleTokens = appleTokens;
        this.appleUser = appleUser;
    }
}
const createSecretId = async (config) => {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: config.teamId,
        iat: now,
        exp: now + 60 * 3,
        aud: APPLE_AUD,
        sub: config.clientId
    };
    const privateKey = getPKCS8Key(config.certificate);
    const jwt = await createES256SignedJWT({
        alg: "ES256",
        kid: config.keyId
    }, payload, privateKey);
    return jwt;
};
