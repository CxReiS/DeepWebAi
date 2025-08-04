import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
const PROVIDER_ID = "strava";
export const strava = (auth, config) => {
    return new StravaAuth(auth, config);
};
export class StravaAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        return await createOAuth2AuthorizationUrl("https://www.strava.com/oauth/authorize", {
            clientId: this.config.clientId,
            scope: this.config.scope ?? ["read"],
            redirectUri: this.config.redirectUri
        });
    };
    validateCallback = async (code) => {
        const [stravaUser, stravaTokens] = await this.validateAuthorizationCode(code);
        return new StravaUserAuth(this.auth, stravaUser, stravaTokens);
    };
    validateAuthorizationCode = async (code) => {
        const { athlete: user, ...tokens } = await validateOAuth2AuthorizationCode(code, "https://www.strava.com/oauth/token", {
            clientId: this.config.clientId,
            clientPassword: {
                clientSecret: this.config.clientSecret,
                authenticateWith: "client_secret"
            }
        });
        if ("refresh_token" in tokens) {
            return [
                user,
                {
                    accessToken: tokens.access_token,
                    accessTokenExpiresIn: tokens.expires_in,
                    refreshToken: tokens.refresh_token
                }
            ];
        }
        return [
            user,
            {
                accessToken: tokens.access_token
            }
        ];
    };
}
export class StravaUserAuth extends ProviderUserAuth {
    stravaTokens;
    stravaUser;
    constructor(auth, stravaUser, stravaTokens) {
        super(auth, PROVIDER_ID, stravaUser.id.toString());
        this.stravaTokens = stravaTokens;
        this.stravaUser = stravaUser;
    }
}
