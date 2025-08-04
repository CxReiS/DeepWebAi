import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "spotify";
export const spotify = (auth, config) => {
    return new SpotifyAuth(auth, config);
};
export class SpotifyAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        return await createOAuth2AuthorizationUrl("https://accounts.spotify.com/authorize", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scope: this.config.scope ?? []
        });
    };
    validateCallback = async (code) => {
        const spotifyTokens = await this.validateAuthorizationCode(code);
        const spotifyUser = await getSpotifyUser(spotifyTokens.accessToken);
        return new SpotifyUserAuth(this.auth, spotifyUser, spotifyTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://accounts.spotify.com/api/token", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            clientPassword: {
                clientSecret: this.config.clientSecret,
                authenticateWith: "http_basic_auth"
            }
        });
        return {
            accessToken: tokens.access_token,
            tokenType: tokens.token_type,
            scope: tokens.scope,
            accessTokenExpiresIn: tokens.expires_in,
            refreshToken: tokens.refresh_token
        };
    };
}
export class SpotifyUserAuth extends ProviderUserAuth {
    spotifyTokens;
    spotifyUser;
    constructor(auth, spotifyUser, spotifyTokens) {
        super(auth, PROVIDER_ID, spotifyUser.id);
        this.spotifyTokens = spotifyTokens;
        this.spotifyUser = spotifyUser;
    }
}
const getSpotifyUser = async (accessToken) => {
    // https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile
    const request = new Request("https://api.spotify.com/v1/me", {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    return handleRequest(request);
};
