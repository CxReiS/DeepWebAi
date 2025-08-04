import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader, originFromDomain } from "../utils/request.js";
const PROVIDER_ID = "auth0";
export const auth0 = (auth, config) => {
    return new Auth0Auth(auth, config);
};
export class Auth0Auth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        const scopeConfig = this.config.scope ?? [];
        return await createOAuth2AuthorizationUrl(new URL("/authorize", originFromDomain(this.config.appDomain)), {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scope: ["openid", "profile", ...scopeConfig]
        });
    };
    validateCallback = async (code) => {
        const auth0Tokens = await this.validateAuthorizationCode(code);
        const auth0User = await getAuth0User(this.config.appDomain, auth0Tokens.accessToken);
        return new Auth0UserAuth(this.auth, auth0User, auth0Tokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, new URL("/oauth/token", this.config.appDomain), {
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
            idToken: tokens.id_token,
            tokenType: tokens.token_type
        };
    };
}
export class Auth0UserAuth extends ProviderUserAuth {
    auth0Tokens;
    auth0User;
    constructor(auth, auth0User, auth0Tokens) {
        super(auth, PROVIDER_ID, auth0User.id);
        this.auth0Tokens = auth0Tokens;
        this.auth0User = auth0User;
    }
}
const getAuth0User = async (appDomain, accessToken) => {
    const request = new Request(new URL("/userinfo", appDomain), {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const auth0Profile = await handleRequest(request);
    const auth0User = {
        id: auth0Profile.sub.split("|")[1],
        ...auth0Profile
    };
    return auth0User;
};
