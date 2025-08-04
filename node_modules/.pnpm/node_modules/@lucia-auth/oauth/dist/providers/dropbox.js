import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "dropbox";
export const dropbox = (auth, config) => {
    return new DropboxAuth(auth, config);
};
export class DropboxAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        const [url, state] = await createOAuth2AuthorizationUrl("https://www.dropbox.com/oauth2/authorize", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scope: ["account_info.read", ...scopeConfig]
        });
        const tokenAccessType = this.config.tokenAccessType ?? "online";
        url.searchParams.set("token_access_type", tokenAccessType);
        return [url, state];
    };
    validateCallback = async (code) => {
        const dropboxTokens = await this.validateAuthorizationCode(code);
        const dropboxUser = await getDropboxUser(dropboxTokens.accessToken);
        return new DropboxUserAuth(this.auth, dropboxUser, dropboxTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://api.dropboxapi.com/oauth2/token", {
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
export class DropboxUserAuth extends ProviderUserAuth {
    dropboxTokens;
    dropboxUser;
    constructor(auth, dropboxUser, dropboxTokens) {
        super(auth, PROVIDER_ID, dropboxUser.account_id);
        this.dropboxTokens = dropboxTokens;
        this.dropboxUser = dropboxUser;
    }
}
const getDropboxUser = async (accessToken) => {
    const request = new Request("https://api.dropboxapi.com/2/users/get_current_account", {
        method: "POST",
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const dropboxUser = await handleRequest(request);
    return dropboxUser;
};
