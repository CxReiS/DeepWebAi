// Enhanced Neon client with branch and compute configuration
import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { configureNeon, getCurrentNeonConfig } from "../../database/neon-config.js";

// Configure Neon with branch and compute settings
configureNeon();

// Get environment-specific configuration
const config = getCurrentNeonConfig();

// Create SQL client
export const sql = neon(config.databaseUrl);

// Create connection pool for heavy operations
export const pool = new Pool({ 
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as health`;
    return result.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Branch information
export function getCurrentBranch(): string {
  return config.branchName || 'main';
}

// Compute settings
export function getComputeSettings() {
  return {
    size: config.computeSize,
    autoSuspend: config.autoSuspend,
    minCu: config.minCu,
    maxCu: config.maxCu
  };
}
