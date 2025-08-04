import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
};
export declare const kakao: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => KakaoAuth<_Auth>;
export declare class KakaoAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<KakaoUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<KakaoUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class KakaoUserAuth<_Auth extends Auth> extends ProviderUserAuth<_Auth> {
    kakaoTokens: KakaoTokens;
    kakaoUser: KakaoUser;
    constructor(auth: _Auth, kakaoUser: KakaoUser, kakaoTokens: KakaoTokens);
}
export type KakaoTokens = {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    refreshTokenExpiresIn: number;
};
export type KakaoUser = {
    id: number;
    has_signed_up?: boolean;
    connected_at?: string;
    synced_at?: string;
    properties?: Record<string, string>;
    kakao_account?: KakaoAccount;
    for_partner?: Partner;
};
type KakaoAccount = {
    profile_needs_agreement?: boolean;
    profile_nickname_needs_agreement?: boolean;
    profile_image_needs_agreement?: boolean;
    profile?: Profile;
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    email?: string;
    name_needs_agreement?: boolean;
    name?: string;
    age_range_needs_agreement?: boolean;
    ag_range?: "1~9" | "10~14" | "15~19" | "20~29" | "30~39" | "40~49" | "50~59" | "60~69" | "70~79" | "80~89" | "90~";
    birthyear_needs_agreement?: boolean;
    birthyear?: string;
    birthday_needs_agreement?: boolean;
    birthday?: string;
    birthday_type?: "SOLAR" | "LUNAR";
    gender_needs_agreement?: boolean;
    gender?: "female" | "male";
    phone_number_needs_agreement?: boolean;
    phone_number?: string;
    ci_needs_agreement?: boolean;
    ci?: string;
    ci_authenticated_at?: string;
};
type Profile = {
    nickname?: string;
    thumbnail_image_url?: string;
    profile_image_url?: string;
    is_default_image?: boolean;
};
type Partner = {
    uuid?: string;
};
export {};
