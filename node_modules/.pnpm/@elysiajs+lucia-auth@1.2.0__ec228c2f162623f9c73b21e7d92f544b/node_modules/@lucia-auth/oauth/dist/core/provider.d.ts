import type { LuciaUser, LuciaDatabaseUserAttributes } from "../lucia.js";
import type { Auth, Key } from "lucia";
export declare class ProviderUserAuth<_Auth extends Auth = Auth> {
    private auth;
    private providerId;
    private providerUserId;
    constructor(auth: _Auth, providerId: string, providerUserId: string);
    getExistingUser: () => Promise<LuciaUser<_Auth> | null>;
    createKey: (userId: string) => Promise<Key>;
    createUser: (options: {
        userId?: string;
        attributes: LuciaDatabaseUserAttributes<_Auth>;
    }) => Promise<LuciaUser<_Auth>>;
}
export declare const providerUserAuth: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, providerId: string, providerUserId: string) => ProviderUserAuth<_Auth>;
