import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { decodeIdToken } from "../core/oidc.js";
import { ProviderUserAuth } from "../core/provider.js";
const PROVIDER_ID = "cognito";
export const cognito = (auth, config) => {
    return new CognitoAuth(auth, config);
};
export class CognitoAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        return await createOAuth2AuthorizationUrl(new URL("/oauth2/authorize", this.config.userPoolDomain), {
            clientId: this.config.clientId,
            scope: ["openid", ...scopeConfig],
            redirectUri: this.config.redirectUri
        });
    };
    validateCallback = async (code) => {
        const cognitoTokens = await this.validateAuthorizationCode(code);
        const cognitoUser = getCognitoUser(cognitoTokens.idToken);
        return new CognitoUserAuth(this.auth, cognitoUser, cognitoTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, new URL("/oauth2/token", this.config.userPoolDomain), {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            clientPassword: {
                authenticateWith: "client_secret",
                clientSecret: this.config.clientSecret
            }
        });
        return {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            idToken: tokens.id_token,
            accessTokenExpiresIn: tokens.expires_in,
            tokenType: tokens.token_type
        };
    };
}
export class CognitoUserAuth extends ProviderUserAuth {
    cognitoTokens;
    cognitoUser;
    constructor(auth, cognitoUser, cognitoTokens) {
        super(auth, PROVIDER_ID, cognitoUser["cognito:username"]);
        this.cognitoTokens = cognitoTokens;
        this.cognitoUser = cognitoUser;
    }
}
const getCognitoUser = (idToken) => {
    const cognitoUser = decodeIdToken(idToken);
    return cognitoUser;
};
