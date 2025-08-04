import { OAuth2ProviderAuth } from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
};
export declare const osu: <_Auth extends Auth<any> = Auth<any>>(auth: _Auth, config: Config) => OsuAuth<_Auth>;
export declare class OsuAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<OsuUserAuth<_Auth>> {
    private config;
    constructor(auth: _Auth, config: Config);
    getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
    validateCallback: (code: string) => Promise<OsuUserAuth<_Auth>>;
    private validateAuthorizationCode;
}
export declare class OsuUserAuth<_Auth extends Auth = Auth> extends ProviderUserAuth<_Auth> {
    osuTokens: OsuTokens;
    osuUser: OsuUser;
    constructor(auth: _Auth, osuUser: OsuUser, osuTokens: OsuTokens);
}
export type OsuTokens = {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
};
export type OsuUser = {
    avatar_url: string;
    country_code: string;
    default_group: string;
    id: number;
    is_active: boolean;
    is_bot: boolean;
    is_deleted: boolean;
    is_online: boolean;
    is_supporter: boolean;
    last_visit: string;
    pm_friends_only: boolean;
    profile_colour: string | null;
    username: string;
    country: {
        code: string;
        name: string;
    };
    cover: {
        custom_url: string | null;
        url: string;
        id: string | null;
    };
    discord: string | null;
    has_supported: boolean;
    interests: string | null;
    join_date: string;
    kudosu: {
        available: number;
        total: number;
    };
    location: string | null;
    max_blocks: number;
    max_friends: number;
    occupation: string | null;
    playmode: OsuGameMode;
    playstyle: ("mouse" | "keyboard" | "tablet" | "touch")[];
    post_count: number;
    profile_order: ("me" | "recent_activity" | "beatmaps" | "historical" | "kudosu" | "top_ranks" | "medals")[];
    title: string | null;
    title_url: string | null;
    twitter: string | null;
    website: string | null;
    is_restricted: boolean;
    account_history: {
        description: string | null;
        id: number;
        length: number;
        permanent: boolean;
        timestamp: string;
        type: "note" | "restriction" | "silence";
    }[];
    active_tournament_banner: {
        id: number;
        tournament_id: number;
        image: string;
    } | null;
    badges: {
        awarded_at: string;
        description: string;
        image_url: string;
        url: string;
    }[];
    beatmap_playcounts_count: number;
    favourite_beatmapset_count: number;
    follower_count: number;
    graveyard_beatmapset_count: number;
    groups: {
        colour: string | null;
        has_listing: boolean;
        has_playmodes: boolean;
        id: number;
        identifier: string;
        is_probationary: boolean;
        name: string;
        short_name: string;
        playmodes: OsuGameMode[] | null;
    }[];
    loved_beatmapset_count: number;
    mapping_follower_count: number;
    monthly_playcounts: {
        start_date: string;
        count: number;
    }[];
    page: {
        html: string;
        raw: string;
    };
    pending_beatmapset_count: number;
    previous_usernames: string[];
    rank_highest: {
        rank: number;
        updated_at: string;
    } | null;
    rank_history: {
        mode: OsuGameMode;
        data: number[];
    };
    ranked_beatmapset_count: number;
    replays_watched_counts: {
        start_date: string;
        count: number;
    }[];
    scores_best_count: number;
    scores_first_count: number;
    scores_recent_count: number;
    statistics: OsuUserStatistics;
    statistics_rulesets: Record<OsuGameMode, OsuUserStatistics | undefined>;
    support_level: number;
    user_achievements: {
        achieved_at: string;
        achievement_id: number;
    }[];
};
type OsuUserStatistics = {
    grade_counts: {
        a: number;
        s: number;
        sh: number;
        ss: number;
        ssh: number;
    };
    hit_accuracy: number;
    is_ranked: boolean;
    level: {
        current: number;
        progress: number;
    };
    maximum_combo: number;
    play_count: number;
    play_time: number;
    pp: number;
    global_rank: number;
    ranked_score: number;
    replays_watched_by_others: number;
    total_hits: number;
    total_score: number;
    country_rank: number;
};
type OsuGameMode = "fruits" | "mania" | "osu" | "taiko";
export {};
