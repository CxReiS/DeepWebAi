import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "reddit";
export const reddit = (auth, config) => {
    return new RedditAuth(auth, config);
};
export class RedditAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const [url, state] = await createOAuth2AuthorizationUrl("https://www.reddit.com/api/v1/authorize", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scope: this.config.scope ?? []
        });
        const tokenDuration = this.config.tokenDuration ?? "permanent";
        url.searchParams.set("duration", tokenDuration);
        return [url, state];
    };
    validateCallback = async (code) => {
        const redditTokens = await this.validateAuthorizationCode(code);
        const redditUser = await getRedditUser(redditTokens.accessToken);
        return new RedditUserAuth(this.auth, redditUser, redditTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://www.reddit.com/api/v1/access_token", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            clientPassword: {
                clientSecret: this.config.clientSecret,
                authenticateWith: "http_basic_auth"
            }
        });
        return {
            accessToken: tokens.access_token
        };
    };
}
export class RedditUserAuth extends ProviderUserAuth {
    redditTokens;
    redditUser;
    constructor(auth, redditUser, redditTokens) {
        super(auth, PROVIDER_ID, redditUser.id);
        this.redditTokens = redditTokens;
        this.redditUser = redditUser;
    }
}
const getRedditUser = async (accessToken) => {
    const request = new Request("https://oauth.reddit.com/api/v1/me", {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const redditUser = await handleRequest(request);
    return redditUser;
};
