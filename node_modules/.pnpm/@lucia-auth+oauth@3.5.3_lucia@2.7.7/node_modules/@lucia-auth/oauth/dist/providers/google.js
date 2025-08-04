import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "google";
export const google = (auth, config) => {
    return new GoogleAuth(auth, config);
};
export class GoogleAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        const [url, state] = await createOAuth2AuthorizationUrl("https://accounts.google.com/o/oauth2/v2/auth", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scope: [
                "https://www.googleapis.com/auth/userinfo.profile",
                ...scopeConfig
            ]
        });
        const accessType = this.config.accessType ?? "online"; // ( default ) online
        url.searchParams.set("access_type", accessType);
        return [url, state];
    };
    validateCallback = async (code) => {
        const googleTokens = await this.validateAuthorizationCode(code);
        const googleUser = await getGoogleUser(googleTokens.accessToken);
        return new GoogleUserAuth(this.auth, googleUser, googleTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://oauth2.googleapis.com/token", {
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
export class GoogleUserAuth extends ProviderUserAuth {
    googleTokens;
    googleUser;
    constructor(auth, googleUser, googleTokens) {
        super(auth, PROVIDER_ID, googleUser.sub);
        this.googleTokens = googleTokens;
        this.googleUser = googleUser;
    }
}
const getGoogleUser = async (accessToken) => {
    const request = new Request("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const googleUser = await handleRequest(request);
    return googleUser;
};
