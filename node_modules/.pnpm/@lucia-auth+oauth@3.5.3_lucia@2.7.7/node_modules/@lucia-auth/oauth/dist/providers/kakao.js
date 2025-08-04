import { createOAuth2AuthorizationUrl, OAuth2ProviderAuth, validateOAuth2AuthorizationCode } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { authorizationHeader, handleRequest } from "../utils/request.js";
const PROVIDER_ID = "kakao";
export const kakao = (auth, config) => {
    return new KakaoAuth(auth, config);
};
export class KakaoAuth extends OAuth2ProviderAuth {
    config;
    constructor(auth, config) {
        super(auth);
        this.config = config;
    }
    getAuthorizationUrl = async () => {
        return await createOAuth2AuthorizationUrl("https://kauth.kakao.com/oauth/authorize", {
            clientId: this.config.clientId,
            scope: [],
            redirectUri: this.config.redirectUri
        });
    };
    validateCallback = async (code) => {
        const kakaoTokens = await this.validateAuthorizationCode(code);
        const kakaoUser = await getKakaoUser(kakaoTokens.accessToken);
        return new KakaoUserAuth(this.auth, kakaoUser, kakaoTokens);
    };
    validateAuthorizationCode = async (code) => {
        const result = await validateOAuth2AuthorizationCode(code, "https://kauth.kakao.com/oauth/token", {
            clientId: this.config.clientId,
            clientPassword: {
                clientSecret: this.config.clientSecret,
                authenticateWith: "client_secret"
            }
        });
        return {
            accessToken: result.access_token,
            expiresIn: result.expires_in,
            refreshToken: result.refresh_token,
            refreshTokenExpiresIn: result.refresh_token_expires_in
        };
    };
}
const getKakaoUser = async (accessToken) => {
    const kakaoUserRequest = new Request("https://kapi.kakao.com/v2/user/me", {
        headers: {
            Authorization: authorizationHeader("bearer", accessToken)
        }
    });
    return await handleRequest(kakaoUserRequest);
};
export class KakaoUserAuth extends ProviderUserAuth {
    kakaoTokens;
    kakaoUser;
    constructor(auth, kakaoUser, kakaoTokens) {
        super(auth, PROVIDER_ID, kakaoUser.id.toString());
        this.kakaoTokens = kakaoTokens;
        this.kakaoUser = kakaoUser;
    }
}
