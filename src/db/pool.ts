import { Pool } from "pg";

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  console.error("FATAL: DATABASE_URL environment variable is not set");
  process.exitCode = 1;
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client:", err);
});

export async function checkConnection(retries = 5, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      try {
        await client.query("SELECT 1");
        console.log("Postgres connection OK");
        return;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error(`Postgres connection attempt ${attempt}/${retries} failed:`, err);
      if (attempt === retries) throw err;
      console.log(`Retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
