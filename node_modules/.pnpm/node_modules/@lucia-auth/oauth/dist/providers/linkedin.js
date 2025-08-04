import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "linkedin";
export const linkedIn = (auth, config) => {
    return new LinkedInAuth(auth, config);
};
export class LinkedInAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        return await createOAuth2AuthorizationUrl("https://www.linkedin.com/oauth/v2/authorization", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scope: ["profile", "openid", ...scopeConfig]
        });
    };
    validateCallback = async (code) => {
        const linkedInTokens = await this.validateAuthorizationCode(code);
        const linkedInUser = await getLinkedInUser(linkedInTokens.accessToken);
        return new LinkedInUserAuth(this.auth, linkedInUser, linkedInTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://www.linkedin.com/oauth/v2/accessToken", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            clientPassword: {
                clientSecret: this.config.clientSecret,
                authenticateWith: "client_secret"
            }
        });
        return {
            accessToken: tokens.access_token,
            accessTokenExpiresIn: tokens.expires_in,
            refreshToken: tokens.refresh_token,
            refreshTokenExpiresIn: tokens.refresh_token_expires_in,
            scope: tokens.scope
        };
    };
}
export class LinkedInUserAuth extends ProviderUserAuth {
    linkedInTokens;
    linkedInUser;
    constructor(auth, linkedInUser, linkedInTokens) {
        super(auth, PROVIDER_ID, linkedInUser.sub);
        this.linkedInTokens = linkedInTokens;
        this.linkedInUser = linkedInUser;
    }
}
const getLinkedInUser = async (accessToken) => {
    const request = new Request("https://api.linkedin.com/v2/userinfo", {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    return handleRequest(request);
};
