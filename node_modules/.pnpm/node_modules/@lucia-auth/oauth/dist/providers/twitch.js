import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "twitch";
export const twitch = (auth, config) => {
    return new TwitchAuth(auth, config);
};
export class TwitchAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        return await createOAuth2AuthorizationUrl("https://id.twitch.tv/oauth2/authorize", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scope: this.config.scope ?? []
        });
    };
    validateCallback = async (code) => {
        const twitchTokens = await this.validateAuthorizationCode(code);
        const twitchUser = await getTwitchUser(this.config.clientId, twitchTokens.accessToken);
        return new TwitchUserAuth(this.auth, twitchUser, twitchTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://id.twitch.tv/oauth2/token", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            clientPassword: {
                clientSecret: this.config.clientSecret,
                authenticateWith: "client_secret"
            }
        });
        return {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            accessTokenExpiresIn: tokens.expires_in
        };
    };
}
export class TwitchUserAuth extends ProviderUserAuth {
    twitchTokens;
    twitchUser;
    constructor(auth, twitchUser, twitchTokens) {
        super(auth, PROVIDER_ID, twitchUser.id);
        this.twitchTokens = twitchTokens;
        this.twitchUser = twitchUser;
    }
}
const getTwitchUser = async (clientId, accessToken) => {
    // https://dev.twitch.tv/docs/api/reference/#get-users
    const request = new Request("https://api.twitch.tv/helix/users", {
        headers: {
            "Client-ID": clientId,
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const twitchUsersResponse = await handleRequest(request);
    return twitchUsersResponse.data[0];
};
