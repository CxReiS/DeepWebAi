import { generateRandomString } from "lucia/utils";
import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "slack";
export const slack = (auth, config) => {
    return new SlackAuth(auth, config);
};
export class SlackAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        const [url, state] = await createOAuth2AuthorizationUrl("https://slack.com/openid/connect/authorize", {
            clientId: this.config.clientId,
            scope: ["openid", "profile", ...scopeConfig],
            redirectUri: this.config.redirectUri
        });
        url.searchParams.set("nonce", generateRandomString(40));
        return [url, state];
    };
    validateCallback = async (code) => {
        const slackTokens = await this.validateAuthorizationCode(code);
        const slackUserRequest = new Request("https://slack.com/api/openid.connect.userInfo", {
            headers: {
                Authorization: authorizationHeader("bearer", slackTokens.accessToken)
            }
        });
        const slackUser = await handleRequest(slackUserRequest);
        return new SlackUserAuth(this.auth, slackUser, slackTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://slack.com/api/openid.connect.token", {
            clientId: this.config.clientId,
            clientPassword: {
                clientSecret: this.config.clientSecret,
                authenticateWith: "client_secret"
            },
            redirectUri: this.config.redirectUri
        });
        return {
            accessToken: tokens.access_token,
            idToken: tokens.id_token
        };
    };
}
export class SlackUserAuth extends ProviderUserAuth {
    slackTokens;
    slackUser;
    constructor(auth, slackUser, slackTokens) {
        super(auth, PROVIDER_ID, slackUser.sub);
        this.slackTokens = slackTokens;
        this.slackUser = slackUser;
    }
}
