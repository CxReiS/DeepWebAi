import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    scope?: string[];
    redirectUri?: string;
};
export declare const github: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => GithubAuth<_Auth>;
export declare class GithubAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<GithubUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<GithubUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class GithubUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
    githubTokens: GithubTokens;
    githubUser: GithubUser;
    constructor(auth: _Auth, githubUser: GithubUser, githubTokens: GithubTokens);
}
export type GithubTokens = {
    accessToken: string;
    accessTokenExpiresIn: null;
} | {
    accessToken: string;
    accessTokenExpiresIn: number;
    refreshToken: string;
    refreshTokenExpiresIn: number;
};
export type GithubUser = PublicGithubUser | PrivateGithubUser;
type PublicGithubUser = {
    avatar_url: string;
    bio: string | null;
    blog: string | null;
    company: string | null;
    created_at: string;
    email: string | null;
    events_url: string;
    followers: number;
    followers_url: string;
    following: number;
    following_url: string;
    gists_url: string;
    gravatar_id: string | null;
    hireable: boolean | null;
    html_url: string;
    id: number;
    location: string | null;
    login: string;
    name: string | null;
    node_id: string;
    organizations_url: string;
    public_gists: number;
    public_repos: number;
    received_events_url: string;
    repos_url: string;
    site_admin: boolean;
    starred_url: string;
    subscriptions_url: string;
    type: string;
    updated_at: string;
    url: string;
    twitter_username?: string | null;
    plan?: {
        name: string;
        space: number;
        private_repos: number;
        collaborators: number;
    };
    suspended_at?: string | null;
};
type PrivateGithubUser = PublicGithubUser & {
    collaborators: number;
    disk_usage: number;
    owned_private_repos: number;
    private_gists: number;
    total_private_repos: number;
    two_factor_authentication: boolean;
    business_plus?: boolean;
    ldap_dn?: string;
};
export {};
