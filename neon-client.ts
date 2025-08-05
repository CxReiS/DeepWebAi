import { Pool } from "pg";
import { config } from "../elysia.config";

let pool: Pool;

function getPool() {
  if (!pool) {
    // Neon'un önerdiği ayarlar ile havuz oluşturuluyor.
    // SSL ve ek parametreler Neon için gereklidir.
    pool = new Pool({
      connectionString: config.databaseUrl,
    });
  }
  return pool;
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await getPool().connect();
    await client.query("SELECT 1");
    client.release();
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}
