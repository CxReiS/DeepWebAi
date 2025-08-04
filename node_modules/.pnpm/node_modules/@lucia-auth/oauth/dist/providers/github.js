import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "github";
export const github = (auth, config) => {
    return new GithubAuth(auth, config);
};
export class GithubAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        return await createOAuth2AuthorizationUrl("https://github.com/login/oauth/authorize", {
            clientId: this.config.clientId,
            scope: this.config.scope ?? [],
            redirectUri: this.config.redirectUri
        });
    };
    validateCallback = async (code) => {
        const githubTokens = await this.validateAuthorizationCode(code);
        const githubUser = await getGithubUser(githubTokens.accessToken);
        return new GithubUserAuth(this.auth, githubUser, githubTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://github.com/login/oauth/access_token", {
            clientId: this.config.clientId,
            clientPassword: {
                clientSecret: this.config.clientSecret,
                authenticateWith: "client_secret"
            }
        });
        if ("refresh_token" in tokens) {
            return {
                accessToken: tokens.access_token,
                accessTokenExpiresIn: tokens.expires_in,
                refreshToken: tokens.refresh_token,
                refreshTokenExpiresIn: tokens.refresh_token_expires_in
            };
        }
        return {
            accessToken: tokens.access_token,
            accessTokenExpiresIn: null
        };
    };
}
const getGithubUser = async (accessToken) => {
    const githubUserRequest = new Request("https://api.github.com/user", {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    return await handleRequest(githubUserRequest);
};
export class GithubUserAuth extends ProviderUserAuth {
    githubTokens;
    githubUser;
    constructor(auth, githubUser, githubTokens) {
        super(auth, PROVIDER_ID, githubUser.id.toString());
        this.githubTokens = githubTokens;
        this.githubUser = githubUser;
    }
}
