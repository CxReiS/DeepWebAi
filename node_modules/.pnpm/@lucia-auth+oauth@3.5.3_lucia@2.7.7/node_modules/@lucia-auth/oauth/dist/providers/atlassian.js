import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "atlassian";
export const atlassian = (auth, config) => {
    return new AtlassianAuth(auth, config);
};
export class AtlassianAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        const [url, state] = await createOAuth2AuthorizationUrl("https://auth.atlassian.com/authorize", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scope: ["read:me", ...scopeConfig]
        });
        url.searchParams.set("audience", "api.atlassian.com");
        url.searchParams.set("prompt", "consent");
        return [url, state];
    };
    validateCallback = async (code) => {
        const atlassianTokens = await this.validateAuthorizationCode(code);
        const atlassianUser = await getAtlassianUser(atlassianTokens.accessToken);
        return new AtlassianUserAuth(this.auth, atlassianUser, atlassianTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://auth.atlassian.com/oauth/token", {
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
            refreshToken: tokens.refresh_token ?? null
        };
    };
}
export class AtlassianUserAuth extends ProviderUserAuth {
    atlassianTokens;
    atlassianUser;
    constructor(auth, atlassianUser, atlassianTokens) {
        super(auth, PROVIDER_ID, atlassianUser.account_id);
        this.atlassianTokens = atlassianTokens;
        this.atlassianUser = atlassianUser;
    }
}
const getAtlassianUser = async (accessToken) => {
    const request = new Request("https://api.atlassian.com/me", {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const atlassianUser = await handleRequest(request);
    return atlassianUser;
};
