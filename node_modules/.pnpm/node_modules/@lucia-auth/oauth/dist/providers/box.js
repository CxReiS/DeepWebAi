import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "box";
export const box = (auth, config) => {
    return new BoxAuth(auth, config);
};
export class BoxAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        return await createOAuth2AuthorizationUrl("https://account.box.com/api/oauth2/authorize", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scope: []
        });
    };
    validateCallback = async (code) => {
        const boxTokens = await this.validateAuthorizationCode(code);
        const boxUser = await getBoxUser(boxTokens.accessToken);
        return new BoxUserAuth(this.auth, boxUser, boxTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://api.box.com/oauth2/token", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            clientPassword: {
                authenticateWith: "client_secret",
                clientSecret: this.config.clientSecret
            }
        });
        return {
            accessToken: tokens.access_token
        };
    };
}
export class BoxUserAuth extends ProviderUserAuth {
    boxTokens;
    boxUser;
    constructor(auth, boxUser, boxTokens) {
        super(auth, PROVIDER_ID, boxUser.id);
        this.boxTokens = boxTokens;
        this.boxUser = boxUser;
    }
}
const getBoxUser = async (accessToken) => {
    const request = new Request("https://api.box.com/2.0/users/me", {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const boxUser = await handleRequest(request);
    return boxUser;
};
