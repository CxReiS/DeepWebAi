/*
 * Copyright (c) 2025 [DeepWebXs]
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
