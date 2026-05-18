import { Pool } from "pg";

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  console.error("FATAL: DATABASE_URL environment variable is not set");
  process.exit(1);
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

export async function checkConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log("Postgres connection OK");
  } finally {
    client.release();
  }
}
