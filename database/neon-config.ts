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

import { neon, neonConfig } from "@neondatabase/serverless";
import { Pool } from "@neondatabase/serverless";

// Neon configuration for different environments
export interface NeonConfig {
  databaseUrl: string;
  branchName?: string;
  computeSize?: "nano" | "micro" | "small" | "medium" | "large" | "xlarge";
  autoSuspend?: number; // seconds
  minCu?: number;
  maxCu?: number;
}

// Environment configurations
export const neonConfigs: Record<string, NeonConfig> = {
  development: {
    databaseUrl: process.env.NEON_DATABASE_URL_DEV || process.env.DATABASE_URL!,
    branchName: "dev",
    computeSize: "nano",
    autoSuspend: 300, // 5 minutes
    minCu: 0.25,
    maxCu: 1
  },
  staging: {
    databaseUrl: process.env.NEON_DATABASE_URL_STAGING || process.env.DATABASE_URL!,
    branchName: "staging", 
    computeSize: "small",
    autoSuspend: 600, // 10 minutes
    minCu: 0.5,
    maxCu: 2
  },
  production: {
    databaseUrl: process.env.NEON_DATABASE_URL_PROD || process.env.DATABASE_URL!,
    branchName: "main",
    computeSize: "medium",
    autoSuspend: 3600, // 1 hour
    minCu: 1,
    maxCu: 4
  }
};

// Get current environment config
export function getCurrentNeonConfig(): NeonConfig {
  const env = process.env.NODE_ENV || "development";
  return neonConfigs[env] || neonConfigs.development;
}

// Configure Neon with branch and compute settings
export function configureNeon() {
  const config = getCurrentNeonConfig();
  
  // Set Neon configuration
  neonConfig.fetchConnectionCache = true;
  neonConfig.webSocketConstructor = typeof WebSocket !== 'undefined' ? WebSocket : require('ws');
  
  return config;
}

// Create Neon SQL client
export function createNeonClient(config?: NeonConfig) {
  const neonConfig = config || getCurrentNeonConfig();
  return neon(neonConfig.databaseUrl);
}

// Create connection pool for heavy operations
export function createNeonPool(config?: NeonConfig) {
  const neonConfig = config || getCurrentNeonConfig();
  return new Pool({ connectionString: neonConfig.databaseUrl });
}

// Branch management utilities
export class NeonBranchManager {
  private apiKey: string;
  private projectId: string;

  constructor() {
    this.apiKey = process.env.NEON_API_KEY!;
    this.projectId = process.env.NEON_PROJECT_ID!;
  }

  async createBranch(name: string, parentBranch = "main") {
    const response = await fetch(`https://console.neon.tech/api/v2/projects/${this.projectId}/branches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        branch: {
          name,
          parent_id: parentBranch
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create branch: ${response.statusText}`);
    }
    
    return response.json();
  }

  async deleteBranch(branchId: string) {
    const response = await fetch(`https://console.neon.tech/api/v2/projects/${this.projectId}/branches/${branchId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete branch: ${response.statusText}`);
    }
    
    return response.json();
  }

  async listBranches() {
    const response = await fetch(`https://console.neon.tech/api/v2/projects/${this.projectId}/branches`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list branches: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Export configured client
export const sql = createNeonClient();
export const pool = createNeonPool();
