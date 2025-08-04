export class OAuthRequestError extends Error {
    request;
    response;
    message = "OAUTH_REQUEST_FAILED";
    constructor(request, response) {
        super("OAUTH_REQUEST_FAILED");
        this.request = request;
        this.response = response;
    }
}
