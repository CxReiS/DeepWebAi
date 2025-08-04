import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "osu";
export const osu = (auth, config) => {
    return new OsuAuth(auth, config);
};
export class OsuAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        return await createOAuth2AuthorizationUrl("https://osu.ppy.sh/oauth/authorize", {
            clientId: this.config.clientId,
            scope: ["identify", ...scopeConfig],
            redirectUri: this.config.redirectUri
        });
    };
    validateCallback = async (code) => {
        const osuTokens = await this.validateAuthorizationCode(code);
        const osuUser = await getOsuUser(osuTokens.accessToken);
        return new OsuUserAuth(this.auth, osuUser, osuTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://osu.ppy.sh/oauth/token", {
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
export class OsuUserAuth extends ProviderUserAuth {
    osuTokens;
    osuUser;
    constructor(auth, osuUser, osuTokens) {
        super(auth, PROVIDER_ID, osuUser.id.toString());
        this.osuTokens = osuTokens;
        this.osuUser = osuUser;
    }
}
const getOsuUser = async (accessToken) => {
    const request = new Request("https://osu.ppy.sh/api/v2/me/osu", {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const osuUser = await handleRequest(request);
    return osuUser;
};
