import { generateRandomString } from "lucia/utils";
import { OAuth2ProviderAuthWithPKCE, createOAuth2AuthorizationUrlWithPKCE, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { authorizationHeader, handleRequest } from "../utils/request.js";
const PROVIDER_ID = "azure_ad";
export const azureAD = (auth, config) => {
    return new AzureADAuth(auth, config);
};
export class AzureADAuth extends OAuth2ProviderAuthWithPKCE {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        const [url, codeVerifier, state] = await createOAuth2AuthorizationUrlWithPKCE(`https://login.microsoftonline.com/${this.config.tenant}/oauth2/v2.0/authorize`, {
            clientId: this.config.clientId,
            codeChallengeMethod: "S256",
            scope: ["openid", "profile", ...scopeConfig],
            redirectUri: this.config.redirectUri
        });
        url.searchParams.set("nonce", generateRandomString(40));
        return [url, codeVerifier, state];
    };
    validateCallback = async (code, code_verifier) => {
        const azureADTokens = await this.validateAuthorizationCode(code, code_verifier);
        const azureADUser = await getAzureADUser(azureADTokens.accessToken);
        return new AzureADUserAuth(this.auth, azureADUser, azureADTokens);
    };
    validateAuthorizationCode = async (code, codeVerifier) => {
        const tokens = await validateOAuth2AuthorizationCode(code, `https://login.microsoftonline.com/${this.config.tenant}/oauth2/v2.0/token`, {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            codeVerifier,
            clientPassword: {
                authenticateWith: "client_secret",
                clientSecret: this.config.clientSecret
            }
        });
        return {
            idToken: tokens.id_token,
            accessToken: tokens.access_token,
            accessTokenExpiresIn: tokens.expires_in,
            refreshToken: tokens.refresh_token ?? null
        };
    };
}
const getAzureADUser = async (accessToken) => {
    const azureADUserRequest = new Request("https://graph.microsoft.com/oidc/userinfo", {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    return await handleRequest(azureADUserRequest);
};
export class AzureADUserAuth extends ProviderUserAuth {
    azureADTokens;
    azureADUser;
    constructor(auth, azureADUser, azureADTokens) {
        super(auth, PROVIDER_ID, azureADUser.sub);
        this.azureADTokens = azureADTokens;
        this.azureADUser = azureADUser;
    }
}
