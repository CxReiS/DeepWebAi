// Test database client that works with ES modules
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || process.env.TEST_DATABASE_URL || '');

export { sql };
