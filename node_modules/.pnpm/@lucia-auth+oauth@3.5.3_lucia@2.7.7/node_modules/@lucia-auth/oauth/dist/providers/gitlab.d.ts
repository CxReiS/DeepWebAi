import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
    serverUrl?: string;
};
export declare const gitlab: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => GitlabAuth<_Auth>;
export declare class GitlabAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<GitlabUserAuth<_Auth>> {
    private config;
    private readonly serverUrl;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<GitlabUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class GitlabUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    gitlabTokens: GitlabTokens;
    gitlabUser: GitlabUser;
    constructor(auth: _Auth, gitlabUser: GitlabUser, gitlabTokens: GitlabTokens);
}
export type GitlabTokens = {
    accessToken: string;
    accessTokenExpiresIn: number;
    refreshToken: string;
};
export type GitlabUser = {
    id: number;
    username: string;
    email: string;
    name: string;
    state: string;
    avatar_url: string;
    web_url: string;
    created_at: string;
    bio: string;
    public_email: string;
    skype: string;
    linkedin: string;
    twitter: string;
    discord: string;
    website_url: string;
    organization: string;
    job_title: string;
    pronouns: string;
    bot: boolean;
    work_information: string | null;
    followers: number;
    following: number;
    local_time: string;
    last_sign_in_at: string;
    confirmed_at: string;
    theme_id: number;
    last_activity_on: string;
    color_scheme_id: number;
    projects_limit: number;
    current_sign_in_at: string;
    identities: {
        provider: string;
        extern_uid: string;
    }[];
    can_create_group: boolean;
    can_create_project: boolean;
    two_factor_enabled: boolean;
    external: boolean;
    private_profile: boolean;
    commit_email: string;
};
export {};
