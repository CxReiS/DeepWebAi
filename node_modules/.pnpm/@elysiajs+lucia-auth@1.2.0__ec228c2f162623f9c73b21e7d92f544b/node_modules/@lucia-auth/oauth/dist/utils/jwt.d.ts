export declare const createES256SignedJWT: (protectedHeader: {
    alg: "ES256";
    kid?: string;
}, payload: Record<any, any>, privateKey: string) => Promise<string>;
