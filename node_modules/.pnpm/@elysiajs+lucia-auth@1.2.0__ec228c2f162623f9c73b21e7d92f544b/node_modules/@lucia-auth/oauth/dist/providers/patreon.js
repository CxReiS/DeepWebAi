import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader, createUrl } from "../utils/request.js";
const PROVIDER_ID = "patreon";
export const patreon = (auth, config) => {
    return new PatreonAuth(auth, config);
};
export class PatreonAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        return await createOAuth2AuthorizationUrl("https://www.patreon.com/oauth2/authorize", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scope: ["identity", ...scopeConfig]
        });
    };
    validateCallback = async (code) => {
        const patreonTokens = await this.validateAuthorizationCode(code);
        const patreonUser = await getPatreonUser(patreonTokens.accessToken);
        return new PatreonUserAuth(this.auth, patreonUser, patreonTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://www.patreon.com/api/oauth2/token", {
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
            accessTokenExpiresIn: tokens.expires_in
        };
    };
}
export class PatreonUserAuth extends ProviderUserAuth {
    patreonTokens;
    patreonUser;
    constructor(auth, patreonUser, patreonTokens) {
        super(auth, PROVIDER_ID, patreonUser.id);
        this.patreonTokens = patreonTokens;
        this.patreonUser = patreonUser;
    }
}
const getPatreonUser = async (accessToken) => {
    const requestUrl = createUrl("https://www.patreon.com/api/oauth2/v2/identity", {
        "fields[user]": "about,email,full_name,hide_pledges,image_url,is_email_verified,url"
    });
    const request = new Request(requestUrl, {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const { data: patreonUser } = await handleRequest(request);
    return patreonUser;
};
