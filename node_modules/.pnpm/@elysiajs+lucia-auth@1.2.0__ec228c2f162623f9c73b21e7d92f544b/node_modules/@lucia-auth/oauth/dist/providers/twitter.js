import { OAuth2ProviderAuthWithPKCE, createOAuth2AuthorizationUrlWithPKCE, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "twitter";
export const twitter = (auth, config) => {
    return new TwitterAuth(auth, config);
};
export class TwitterAuth extends OAuth2ProviderAuthWithPKCE {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        return await createOAuth2AuthorizationUrlWithPKCE("https://twitter.com/i/oauth2/authorize", {
            clientId: this.config.clientId,
            codeChallengeMethod: "S256",
            scope: ["tweet.read", "users.read", ...scopeConfig],
            redirectUri: this.config.redirectUri
        });
    };
    validateCallback = async (code, code_verifier) => {
        const twitterTokens = await this.validateAuthorizationCode(code, code_verifier);
        const twitterUser = await getTwitterUser(twitterTokens.accessToken);
        return new TwitterUserAuth(this.auth, twitterUser, twitterTokens);
    };
    validateAuthorizationCode = async (code, codeVerifier) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://api.twitter.com/2/oauth2/token", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            codeVerifier,
            clientPassword: {
                authenticateWith: "http_basic_auth",
                clientSecret: this.config.clientSecret
            }
        });
        return {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? null
        };
    };
}
export class TwitterUserAuth extends ProviderUserAuth {
    twitterTokens;
    twitterUser;
    constructor(auth, twitterUser, twitterTokens) {
        super(auth, PROVIDER_ID, twitterUser.id);
        this.twitterTokens = twitterTokens;
        this.twitterUser = twitterUser;
    }
}
const getTwitterUser = async (accessToken) => {
    const request = new Request("https://api.twitter.com/2/users/me", {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const twitterUserResult = await handleRequest(request);
    return twitterUserResult.data;
};
