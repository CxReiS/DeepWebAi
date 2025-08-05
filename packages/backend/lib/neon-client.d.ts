import { Pool } from "@neondatabase/serverless";
export declare const sql: import("@neondatabase/serverless").NeonQueryFunction<false, false>;
export declare const pool: Pool;
export declare function checkDatabaseHealth(): Promise<boolean>;
export declare function getCurrentBranch(): string;
export declare function getComputeSettings(): {
    size: "medium" | "nano" | "micro" | "small" | "large" | "xlarge" | undefined;
    autoSuspend: number | undefined;
    minCu: number | undefined;
    maxCu: number | undefined;
};
