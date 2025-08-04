import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader, createUrl } from "../utils/request.js";
const PROVIDER_ID = "facebook";
export const facebook = (auth, config) => {
    return new FacebookAuth(auth, config);
};
export class FacebookAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        return await createOAuth2AuthorizationUrl("https://www.facebook.com/v16.0/dialog/oauth", {
            clientId: this.config.clientId,
            scope: this.config.scope ?? [],
            redirectUri: this.config.redirectUri
        });
    };
    validateCallback = async (code) => {
        const facebookTokens = await this.validateAuthorizationCode(code);
        const facebookUser = await getFacebookUser(facebookTokens.accessToken);
        return new FacebookUserAuth(this.auth, facebookUser, facebookTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://graph.facebook.com/v16.0/oauth/access_token", {
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
export class FacebookUserAuth extends ProviderUserAuth {
    facebookTokens;
    facebookUser;
    constructor(auth, facebookUser, facebookTokens) {
        super(auth, PROVIDER_ID, facebookUser.id);
        this.facebookTokens = facebookTokens;
        this.facebookUser = facebookUser;
    }
}
const getFacebookUser = async (accessToken) => {
    const requestUrl = createUrl("https://graph.facebook.com/me", {
        access_token: accessToken,
        fields: ["id", "name", "picture", "email"].join(",")
    });
    const request = new Request(requestUrl, {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const facebookUser = await handleRequest(request);
    return facebookUser;
};
