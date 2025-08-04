import { OAuthRequestError } from "../core/request.js";
export const handleRequest = async (request) => {
    request.headers.set("User-Agent", "lucia");
    request.headers.set("Accept", "application/json");
    const response = await fetch(request);
    if (!response.ok) {
        throw new OAuthRequestError(request, response);
    }
    return (await response.json());
};
export const createUrl = (url, urlSearchParams) => {
    const newUrl = new URL(url);
    for (const [key, value] of Object.entries(urlSearchParams)) {
        if (!value)
            continue;
        newUrl.searchParams.set(key, value);
    }
    return newUrl;
};
export const authorizationHeader = (type, token) => {
    if (type === "basic") {
        return ["Basic", token].join(" ");
    }
    if (type === "bearer") {
        return ["Bearer", token].join(" ");
    }
    throw new TypeError("Invalid token type");
};
export const originFromDomain = (domain) => {
    if (domain.startsWith("https://") || domain.startsWith("http://")) {
        return domain;
    }
    return "https://" + domain;
};
