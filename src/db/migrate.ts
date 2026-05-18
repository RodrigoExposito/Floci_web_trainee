import { fileURLToPath } from "url";
import { pool } from "./pool.js";

// Schema embedded as a string so no external .sql file is needed at runtime.
// tsc compiles this into dist/db/migrate.js — no ENOENT risk.
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS progress (
  id           SERIAL PRIMARY KEY,
  track_id     TEXT NOT NULL,
  module_id    TEXT NOT NULL,
  lesson_id    TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'locked',
  completed_at TIMESTAMP,
  UNIQUE (track_id, module_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS challenge_attempts (
  id             SERIAL PRIMARY KEY,
  track_id       TEXT NOT NULL,
  challenge_id   TEXT NOT NULL,
  attempt_number INT  NOT NULL DEFAULT 1,
  passed         BOOLEAN NOT NULL DEFAULT FALSE,
  feedback       TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weak_areas (
  id         SERIAL PRIMARY KEY,
  track_id   TEXT NOT NULL,
  module_id  TEXT NOT NULL,
  topic      TEXT NOT NULL,
  miss_count INT  NOT NULL DEFAULT 0
);
`;

export async function runMigration(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log("Running database migration...");
    await client.query(SCHEMA_SQL);
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
