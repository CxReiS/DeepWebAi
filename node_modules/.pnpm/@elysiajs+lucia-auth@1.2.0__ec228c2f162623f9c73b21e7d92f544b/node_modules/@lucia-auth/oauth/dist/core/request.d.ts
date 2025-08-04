export declare class OAuthRequestError extends Error {
    request: Request;
    response: Response;
    message: "OAUTH_REQUEST_FAILED";
    constructor(request: Request, response: Response);
}
