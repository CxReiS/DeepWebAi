import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
};
export declare const box: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => BoxAuth<_Auth>;
export declare class BoxAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<BoxUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<BoxUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class BoxUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    boxTokens: BoxTokens;
    boxUser: BoxUser;
    constructor(auth: _Auth, boxUser: BoxUser, boxTokens: BoxTokens);
}
export type BoxTokens = {
    accessToken: string;
};
export type BoxUser = {
    id: string;
    type: "user";
    address: string;
    avatar_url: string;
    can_see_managed_users: boolean;
    created_at: string;
    enterprise: {
        id: string;
        type: string;
        name: string;
    };
    external_app_user_id: string;
    hostname: string;
    is_exempt_from_device_limits: boolean;
    is_exempt_from_login_verification: boolean;
    is_external_collab_restricted: boolean;
    is_platform_access_only: boolean;
    is_sync_enabled: boolean;
    job_title: string;
    language: string;
    login: string;
    max_upload_size: number;
    modified_at: string;
    my_tags: [string];
    name: string;
    notification_email: {
        email: string;
        is_confirmed: boolean;
    };
    phone: string;
    role: string;
    space_amount: number;
    space_used: number;
    status: "active" | "inactive" | "cannot_delete_edit" | "cannot_delete_edit_upload";
    timezone: string;
    tracking_codes: {
        type: string;
        name: string;
        value: string;
    }[];
};
export {};
