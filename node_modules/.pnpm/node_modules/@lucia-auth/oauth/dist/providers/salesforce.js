import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "salesforce";
export const salesforce = (auth, config) => {
    return new SalesforceAuth(auth, config);
};
export class SalesforceAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        return await createOAuth2AuthorizationUrl("https://login.salesforce.com/services/oauth2/authorize", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scope: ["openid", "id", "profile", ...scopeConfig]
        });
    };
    validateCallback = async (code) => {
        const salesforceTokens = await this.validateAuthorizationCode(code);
        const salesforceUser = await getSalesforceUser(salesforceTokens.accessToken);
        return new SalesforceUserAuth(this.auth, salesforceUser, salesforceTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://login.salesforce.com/services/oauth2/token", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            clientPassword: {
                clientSecret: this.config.clientSecret,
                authenticateWith: "client_secret"
            }
        });
        return {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? null,
            idToken: tokens.id_token
        };
    };
}
export class SalesforceUserAuth extends ProviderUserAuth {
    salesforceTokens;
    salesforceUser;
    constructor(auth, salesforceUser, salesforceTokens) {
        super(auth, PROVIDER_ID, salesforceUser.user_id);
        this.salesforceTokens = salesforceTokens;
        this.salesforceUser = salesforceUser;
    }
}
const getSalesforceUser = async (accessToken) => {
    const request = new Request("https://login.salesforce.com/services/oauth2/userinfo", {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const salesforceUser = await handleRequest(request);
    return salesforceUser;
};
