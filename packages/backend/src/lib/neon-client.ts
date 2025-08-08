// Simplified Neon client without external cross-package imports
import { neon, Pool } from "@neondatabase/serverless";

// Read database URL from environment
const DATABASE_URL = process.env.DATABASE_URL || "";
if (!DATABASE_URL) {
  console.warn("DATABASE_URL is not set; database operations will fail at runtime");
}

// Create SQL tag client (HTTP-based)
export const sql = neon(DATABASE_URL);

// Create connection pool for heavy operations if needed
export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as health`;
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Branch and compute placeholders for compatibility
export function getCurrentBranch(): string {
  return process.env.NEON_BRANCH || 'main';
}

export function getComputeSettings() {
  return {
    size: process.env.NEON_COMPUTE_SIZE || 'micro',
    autoSuspend: Number(process.env.NEON_AUTO_SUSPEND || 300),
    minCu: Number(process.env.NEON_MIN_CU || 0.25),
    maxCu: Number(process.env.NEON_MAX_CU || 1)
  };
}
