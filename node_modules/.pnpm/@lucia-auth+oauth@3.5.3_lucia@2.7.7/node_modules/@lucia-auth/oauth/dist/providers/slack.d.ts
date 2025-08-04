import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
};
export declare const slack: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => SlackAuth<_Auth>;
export declare class SlackAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<SlackUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<SlackUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class SlackUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
    slackTokens: SlackTokens;
    slackUser: SlackUser;
    constructor(auth: _Auth, slackUser: SlackUser, slackTokens: SlackTokens);
}
export type SlackTokens = {
    accessToken: string;
    idToken: string;
};
export type SlackUser = {
    sub: string;
    "https://slack.com/user_id": string;
    "https://slack.com/team_id": string;
    email?: string;
    email_verified: boolean;
    date_email_verified: number;
    name: string;
    picture: string;
    given_name: string;
    family_name: string;
    locale: string;
    "https://slack.com/team_name": string;
    "https://slack.com/team_domain": string;
    "https://slack.com/user_image_24": string;
    "https://slack.com/user_image_32": string;
    "https://slack.com/user_image_48": string;
    "https://slack.com/user_image_72": string;
    "https://slack.com/user_image_192": string;
    "https://slack.com/user_image_512": string;
    "https://slack.com/team_image_34": string;
    "https://slack.com/team_image_44": string;
    "https://slack.com/team_image_68": string;
    "https://slack.com/team_image_88": string;
    "https://slack.com/team_image_102": string;
    "https://slack.com/team_image_132": string;
    "https://slack.com/team_image_230": string;
    "https://slack.com/team_image_default": true;
};
export {};
