import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { decodeIdToken } from "../core/oidc.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "line";
export const line = (auth, config) => {
    return new LineAuth(auth, config);
};
export class LineAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        return await createOAuth2AuthorizationUrl("https://access.line.me/oauth2/v2.1/authorize", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scope: ["profile", "openid", ...scopeConfig]
        });
    };
    validateCallback = async (code) => {
        const lineTokens = await this.validateAuthorizationCode(code);
        const lineUser = await getLineUser(lineTokens.accessToken, lineTokens.idToken);
        return new LineUserAuth(this.auth, lineUser, lineTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://api.line.me/oauth2/v2.1/token", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            clientPassword: {
                authenticateWith: "client_secret",
                clientSecret: this.config.clientSecret
            }
        });
        return {
            accessToken: tokens.access_token,
            accessTokenExpiresIn: tokens.expires_in,
            refreshToken: tokens.refresh_token,
            idToken: tokens.id_token
        };
    };
}
export class LineUserAuth extends ProviderUserAuth {
    lineTokens;
    lineUser;
    constructor(auth, lineUser, lineTokens) {
        super(auth, PROVIDER_ID, lineUser.userId);
        this.lineTokens = lineTokens;
        this.lineUser = lineUser;
    }
}
const getLineUser = async (accessToken, idToken) => {
    const request = new Request("https://api.line.me/v2/profile", {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const partialLineUser = await handleRequest(request);
    const idTokenClaims = decodeIdToken(idToken);
    return {
        email: idTokenClaims.email ?? null,
        ...partialLineUser
    };
};
