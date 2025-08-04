import { OAuth2ProviderAuth, createOAuth2AuthorizationUrl, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";
const PROVIDER_ID = "bitbucket";
export const bitbucket = (auth, config) => {
    return new BitbucketAuth(auth, config);
};
export class BitbucketAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        return await createOAuth2AuthorizationUrl("https://bitbucket.org/site/oauth2/authorize", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scope: ["account"]
        });
    };
    validateCallback = async (code) => {
        const bitbucketTokens = await this.validateAuthorizationCode(code);
        const bitbucketUser = await getBitbucketUser(bitbucketTokens.accessToken);
        return new BitbucketUserAuth(this.auth, bitbucketUser, bitbucketTokens);
    };
    validateAuthorizationCode = async (code) => {
        const tokens = await validateOAuth2AuthorizationCode(code, "https://bitbucket.org/site/oauth2/access_token", {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            clientPassword: {
                authenticateWith: "http_basic_auth",
                clientSecret: this.config.clientSecret
            }
        });
        return {
            accessToken: tokens.access_token,
            accessTokenExpiresIn: tokens.expires_in,
            refreshToken: tokens.refresh_token
        };
    };
}
export class BitbucketUserAuth extends ProviderUserAuth {
    bitbucketTokens;
    bitbucketUser;
    constructor(auth, bitbucketUser, bitbucketTokens) {
        super(auth, PROVIDER_ID, bitbucketUser.uuid);
        this.bitbucketTokens = bitbucketTokens;
        this.bitbucketUser = bitbucketUser;
    }
}
const getBitbucketUser = async (accessToken) => {
    const request = new Request("https://api.bitbucket.org/2.0/user", {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    const bitbucketUser = await handleRequest(request);
    return bitbucketUser;
};
