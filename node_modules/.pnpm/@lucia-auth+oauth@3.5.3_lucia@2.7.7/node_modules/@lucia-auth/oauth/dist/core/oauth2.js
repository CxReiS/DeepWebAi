import { authorizationHeader, createUrl, handleRequest } from "../utils/request.js";
import { encodeBase64, encodeBase64Url } from "../utils/encode.js";
import { generateRandomString } from "lucia/utils";
export class OAuth2ProviderAuth {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
}
export class OAuth2ProviderAuthWithPKCE {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
}
export const createOAuth2AuthorizationUrl = async (url, options) => {
    const state = generateState();
    const authorizationUrl = createUrl(url, {
        response_type: "code",
        client_id: options.clientId,
        scope: options.scope.join(" "),
        state,
        redirect_uri: options.redirectUri
    });
    return [authorizationUrl, state];
};
export const createOAuth2AuthorizationUrlWithPKCE = async (url, options) => {
    const codeVerifier = generateRandomString(96, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_.~");
    const codeChallenge = await generatePKCECodeChallenge("S256", codeVerifier);
    const state = generateState();
    const authorizationUrl = createUrl(url, {
        response_type: "code",
        client_id: options.clientId,
        scope: options.scope.join(" "),
        state,
        redirect_uri: options.redirectUri,
        code_challenge_method: "S256",
        code_challenge: codeChallenge
    });
    return [authorizationUrl, codeVerifier, state];
};
export const validateOAuth2AuthorizationCode = async (authorizationCode, url, options) => {
    const body = new URLSearchParams({
        code: authorizationCode,
        client_id: options.clientId,
        grant_type: "authorization_code"
    });
    if (options.redirectUri) {
        body.set("redirect_uri", options.redirectUri);
    }
    if (options.codeVerifier) {
        body.set("code_verifier", options.codeVerifier);
    }
    if (options.clientPassword &&
        options.clientPassword.authenticateWith === "client_secret") {
        body.set("client_secret", options.clientPassword.clientSecret);
    }
    const headers = new Headers({
        "Content-Type": "application/x-www-form-urlencoded"
    });
    if (options.clientPassword &&
        options.clientPassword.authenticateWith === "http_basic_auth") {
        headers.set("Authorization", authorizationHeader("basic", encodeBase64(`${options.clientId}:${options.clientPassword.clientSecret}`)));
    }
    const request = new Request(new URL(url), {
        method: "POST",
        headers,
        body
    });
    return await handleRequest(request);
};
export const generateState = () => {
    return generateRandomString(43);
};
// Generates code_challenge from code_verifier, as specified in RFC 7636.
export const generatePKCECodeChallenge = async (method, verifier) => {
    if (method === "S256") {
        const verifierBuffer = new TextEncoder().encode(verifier);
        const challengeBuffer = await crypto.subtle.digest("SHA-256", verifierBuffer);
        return encodeBase64Url(challengeBuffer);
    }
    throw new TypeError("Invalid PKCE code challenge method");
};
