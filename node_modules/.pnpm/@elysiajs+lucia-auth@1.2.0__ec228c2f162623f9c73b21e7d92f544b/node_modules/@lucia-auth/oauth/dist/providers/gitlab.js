import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "gitlab";
export const gitlab = (auth, config) => {
    return new GitlabAuth(auth, config);
};
export class GitlabAuth extends OAuth2ProviderAuth {
    config;
    serverUrl;
    constructor(auth, config) {
        super(auth);
        this.config = config;
        this.serverUrl = config.serverUrl || "https://gitlab.com";
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        return await createOAuth2AuthorizationUrl(`${this.serverUrl}/oauth/authorize`, {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scope: ["read_user", ...scopeConfig]
        });
    };
    validateCallback = async (code) => {
        const gitlabTokens = await this.validateAuthorizationCode(code);
        const gitlabUser = await getGitlabUser(gitlabTokens.accessToken, this.serverUrl);
        return new GitlabUserAuth(this.auth, gitlabUser, gitlabTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, `${this.serverUrl}/oauth/token`, {
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
            refreshToken: tokens.refresh_token
        };
    };
}
export class GitlabUserAuth extends ProviderUserAuth {
    gitlabTokens;
    gitlabUser;
    constructor(auth, gitlabUser, gitlabTokens) {
        super(auth, PROVIDER_ID, gitlabUser.id.toString());
        this.gitlabTokens = gitlabTokens;
        this.gitlabUser = gitlabUser;
    }
}
const getGitlabUser = async (accessToken, serverUrl) => {
    const request = new Request(`${serverUrl}/api/v4/user`, {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const gitlabUser = await handleRequest(request);
    return gitlabUser;
};
