export declare const handleRequest: <_ResponseBody extends {}>(request: Request) => Promise<_ResponseBody>;
export declare const createUrl: (url: string | URL, urlSearchParams: Record<string, string | undefined>) => URL;
export declare const authorizationHeader: (type: "bearer" | "basic", token: string) => string;
export declare const originFromDomain: (domain: string) => string;
