export interface NeonConfig {
    databaseUrl: string;
    branchName?: string;
    computeSize?: "nano" | "micro" | "small" | "medium" | "large" | "xlarge";
    autoSuspend?: number;
    minCu?: number;
    maxCu?: number;
}
export declare const neonConfigs: Record<string, NeonConfig>;
export declare function getCurrentNeonConfig(): NeonConfig;
export declare function configureNeon(): NeonConfig;
export declare function createNeonClient(config?: NeonConfig): any;
export declare function createNeonPool(config?: NeonConfig): any;
export declare class NeonBranchManager {
    private apiKey;
    private projectId;
    constructor();
    createBranch(name: string, parentBranch?: string): Promise<unknown>;
    deleteBranch(branchId: string): Promise<unknown>;
    listBranches(): Promise<unknown>;
}
export declare const sql: any;
export declare const pool: any;
