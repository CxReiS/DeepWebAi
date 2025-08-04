import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "discord";
export const discord = (auth, config) => {
    return new DiscordAuth(auth, config);
};
export class DiscordAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        return await createOAuth2AuthorizationUrl("https://discord.com/oauth2/authorize", {
            clientId: this.config.clientId,
            scope: ["identify", ...scopeConfig],
            redirectUri: this.config.redirectUri
        });
    };
    validateCallback = async (code) => {
        const discordTokens = await this.validateAuthorizationCode(code);
        const discordUser = await getDiscordUser(discordTokens.accessToken);
        return new DiscordUserAuth(this.auth, discordUser, discordTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://discord.com/api/oauth2/token", {
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
export class DiscordUserAuth extends ProviderUserAuth {
    discordTokens;
    discordUser;
    constructor(auth, discordUser, discordTokens) {
        super(auth, PROVIDER_ID, discordUser.id);
        this.discordTokens = discordTokens;
        this.discordUser = discordUser;
    }
}
const getDiscordUser = async (accessToken) => {
    // do not use oauth/users/@me because it ignores intents, use oauth/users/@me instead
    const request = new Request("https://discord.com/api/users/@me", {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const discordUser = await handleRequest(request);
    return discordUser;
};
