import { OAuth2ProviderAuthWithPKCE, createOAuth2AuthorizationUrlWithPKCE, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "lichess";
export const lichess = (auth, config) => {
    return new LichessAuth(auth, config);
};
export class LichessAuth extends OAuth2ProviderAuthWithPKCE {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        return await createOAuth2AuthorizationUrlWithPKCE("https://lichess.org/oauth", {
            clientId: this.config.clientId,
            codeChallengeMethod: "S256",
            scope: this.config.scope ?? [],
            redirectUri: this.config.redirectUri
        });
    };
    validateCallback = async (code, code_verifier) => {
        const lichessTokens = await this.validateAuthorizationCode(code, code_verifier);
        const lichessUser = await getLichessUser(lichessTokens.accessToken);
        return new LichessUserAuth(this.auth, lichessUser, lichessTokens);
    };
    validateAuthorizationCode = async (code, codeVerifier) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://lichess.org/api/token", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            codeVerifier
        });
        return {
            accessToken: tokens.access_token,
            accessTokenExpiresIn: tokens.expires_in
        };
    };
}
const getLichessUser = async (accessToken) => {
    const request = new Request("https://lichess.org/api/account", {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const lichessUser = await handleRequest(request);
    return lichessUser;
};
export class LichessUserAuth extends ProviderUserAuth {
    lichessTokens;
    lichessUser;
    constructor(auth, lichessUser, lichessTokens) {
        super(auth, PROVIDER_ID, lichessUser.id);
        this.lichessTokens = lichessTokens;
        this.lichessUser = lichessUser;
    }
}
