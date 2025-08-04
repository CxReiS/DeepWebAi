import { createHeadersFromObject } from "../utils/request.js";
export const node = () => {
    return ({ args }) => {
        const [incomingMessage, outgoingMessage] = args;
        const requestContext = {
            request: {
                method: incomingMessage.method ?? "",
                headers: createHeadersFromObject(incomingMessage.headers)
            },
            setCookie: (cookie) => {
                let parsedSetCookieHeaderValues = [];
                const setCookieHeaderValue = outgoingMessage.getHeader("Set-Cookie");
                if (typeof setCookieHeaderValue === "string") {
                    parsedSetCookieHeaderValues = [setCookieHeaderValue];
                }
                else if (Array.isArray(setCookieHeaderValue)) {
                    parsedSetCookieHeaderValues = setCookieHeaderValue;
                }
                outgoingMessage.setHeader("Set-Cookie", [
                    cookie.serialize(),
                    ...parsedSetCookieHeaderValues
                ]);
            }
        };
        return requestContext;
    };
};
export const express = () => {
    return ({ args }) => {
        const [req, res] = args;
        const requestContext = {
            request: {
                method: req.method,
                headers: createHeadersFromObject(req.headers)
            },
            setCookie: (cookie) => {
                const cookieMaxAge = cookie.attributes.maxAge;
                res.cookie(cookie.name, cookie.value, {
                    ...cookie.attributes,
                    maxAge: cookieMaxAge ? cookieMaxAge * 1000 : cookieMaxAge
                });
            }
        };
        return requestContext;
    };
};
export const fastify = () => {
    return ({ args }) => {
        const [req, res] = args;
        const requestContext = {
            request: {
                method: req.method,
                headers: createHeadersFromObject(req.headers)
            },
            setCookie: (cookie) => {
                res.header("Set-Cookie", [cookie.serialize()]);
            }
        };
        return requestContext;
    };
};
export const sveltekit = () => {
    return ({ args, sessionCookieName }) => {
        const [event] = args;
        const requestContext = {
            request: event.request,
            sessionCookie: event.cookies.get(sessionCookieName) ?? null,
            setCookie: (cookie) => {
                event.cookies.set(cookie.name, cookie.value, {
                    path: ".",
                    ...cookie.attributes
                });
            }
        };
        return requestContext;
    };
};
export const astro = () => {
    return ({ args, sessionCookieName }) => {
        const [context] = args;
        const requestContext = {
            request: context.request,
            sessionCookie: context.cookies.get(sessionCookieName)?.value || null,
            setCookie: (cookie) => {
                context.cookies.set(cookie.name, cookie.value, cookie.attributes);
            }
        };
        return requestContext;
    };
};
export const qwik = () => {
    return ({ args, sessionCookieName }) => {
        const [event] = args;
        const requestContext = {
            request: event.request,
            sessionCookie: event.cookie.get(sessionCookieName)?.value ?? null,
            setCookie: (cookie) => {
                event.cookie.set(cookie.name, cookie.value, cookie.attributes);
            }
        };
        return requestContext;
    };
};
export const elysia = () => {
    return ({ args }) => {
        const [{ request, set }] = args;
        return {
            request,
            setCookie: (cookie) => {
                const setCookieHeader = set.headers["Set-Cookie"] ?? [];
                const setCookieHeaders = Array.isArray(setCookieHeader)
                    ? setCookieHeader
                    : [setCookieHeader];
                setCookieHeaders.push(cookie.serialize());
                set.headers["Set-Cookie"] = setCookieHeaders;
            }
        };
    };
};
export const lucia = () => {
    return ({ args }) => args[0];
};
export const web = () => {
    return ({ args }) => {
        const [request] = args;
        const requestContext = {
            request,
            setCookie: () => {
                throw new Error("Cookies cannot be set when using the `web()` middleware");
            }
        };
        return requestContext;
    };
};
export const nextjs = () => {
    return ({ args, sessionCookieName, env }) => {
        const [serverContext] = args;
        if ("cookies" in serverContext) {
            // for some reason `"request" in NextRequest` returns true???
            const request = typeof serverContext.cookies === "function"
                ? serverContext.request
                : serverContext;
            const readonlyCookieStore = typeof serverContext.cookies === "function"
                ? serverContext.cookies()
                : serverContext.cookies;
            const sessionCookie = readonlyCookieStore.get(sessionCookieName)?.value ?? null;
            const requestContext = {
                request: request ?? {
                    method: "GET",
                    headers: new Headers()
                },
                sessionCookie,
                setCookie: (cookie) => {
                    if (typeof serverContext.cookies !== "function")
                        return;
                    const cookieStore = serverContext.cookies();
                    if (!cookieStore.set)
                        return;
                    try {
                        cookieStore.set(cookie.name, cookie.value, cookie.attributes);
                    }
                    catch {
                        // ignore - set() is not available
                    }
                }
            };
            return requestContext;
        }
        const req = "req" in serverContext ? serverContext.req : serverContext;
        const res = "res" in serverContext ? serverContext.res : null;
        const request = {
            method: req.method ?? "",
            headers: createHeadersFromObject(req.headers)
        };
        return {
            request,
            setCookie: (cookie) => {
                if (!res)
                    return;
                const setCookieHeaderValues = res
                    .getHeader("Set-Cookie")
                    ?.toString()
                    .split(",")
                    .filter((val) => val) ?? [];
                res.setHeader("Set-Cookie", [
                    cookie.serialize(),
                    ...setCookieHeaderValues
                ]);
            }
        };
    };
};
export const nextjs_future = () => {
    return ({ args, sessionCookieName }) => {
        if (args.length === 2) {
            const [requestMethod, context] = args;
            return {
                request: {
                    method: requestMethod,
                    headers: context.headers()
                },
                setCookie: (cookie) => {
                    try {
                        context.cookies().set(cookie.name, cookie.value, cookie.attributes);
                    }
                    catch {
                        // ignore error
                        // can't differentiate between page.tsx render (can't set cookies)
                        // vs API routes (can set cookies)
                    }
                },
                sessionCookie: context.cookies().get(sessionCookieName)?.value ?? null
            };
        }
        if ("req" in args[0]) {
            const [{ req, res }] = args;
            return {
                request: {
                    method: req.method ?? "",
                    headers: createHeadersFromObject(req.headers)
                },
                setCookie: (cookie) => {
                    if (!res)
                        return;
                    const setCookieHeaderValues = res
                        .getHeader("Set-Cookie")
                        ?.toString()
                        .split(",")
                        .filter((val) => val) ?? [];
                    res.setHeader("Set-Cookie", [
                        cookie.serialize(),
                        ...setCookieHeaderValues
                    ]);
                }
            };
        }
        const [request] = args;
        return {
            request,
            setCookie: () => {
                throw new Error("Cookies cannot be set when using the `web()` middleware");
            },
            sessionCookie: request.cookies.get(sessionCookieName)?.value ?? null
        };
    };
};
export const h3 = () => {
    const nodeMiddleware = node();
    return ({ args, sessionCookieName, env }) => {
        const [context] = args;
        return nodeMiddleware({
            args: [context.node.req, context.node.res],
            sessionCookieName,
            env
        });
    };
};
export const hono = () => {
    return ({ args }) => {
        const [context] = args;
        return {
            request: context.req,
            setCookie: (cookie) => {
                context.header("Set-Cookie", cookie.serialize());
            }
        };
    };
};
