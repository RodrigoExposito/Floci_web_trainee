import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { pool } from "./pool.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigration(): Promise<void> {
  const schemaPath = join(__dirname, "schema.sql");
  const sql = readFileSync(schemaPath, "utf-8");

  const client = await pool.connect();
  try {
    console.log("Running database migration...");
    await client.query(sql);
    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
    throw err;
  } finally {
    client.release();
    // NOTE: does not call pool.end() — caller is responsible
  }
}

// Standalone execution: node dist/db/migrate.js  OR  pnpm run migrate
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  runMigration()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      pool.end().finally(() => process.exit(1));
    });
}
