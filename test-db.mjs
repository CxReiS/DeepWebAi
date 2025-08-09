// test-db.js
import { Client } from "pg";
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const res = await client.query("SELECT 1");
console.log(res.rows);
await client.end();
