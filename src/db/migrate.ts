import { fileURLToPath } from "url";
import { pool } from "./pool.js";

// Schema embedded as a string so no external .sql file is needed at runtime.
// tsc compiles this into dist/db/migrate.js — no ENOENT risk.
const SCHEMA_SQL = `
-- ── users ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name  TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- ── progress ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id),
  track_id     TEXT NOT NULL,
  module_id    TEXT NOT NULL,
  lesson_id    TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'locked',
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS challenge_attempts (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id),
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
  user_id    INTEGER REFERENCES users(id),
  track_id   TEXT NOT NULL,
  module_id  TEXT NOT NULL,
  topic      TEXT NOT NULL,
  miss_count INT  NOT NULL DEFAULT 0
);

-- ── idempotent migrations for existing deployments ────────────────────────────

-- Add user_id columns if missing (safe to run on fresh DBs that already have them)
ALTER TABLE progress          ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE challenge_attempts ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE weak_areas        ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- Migrate progress UNIQUE constraint from (track_id, module_id, lesson_id)
-- to (user_id, track_id, module_id, lesson_id).
DO $$
BEGIN
  -- Drop the old 3-column constraint if it still exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'progress' AND c.contype = 'u'
      AND c.conname = 'progress_track_id_module_id_lesson_id_key'
  ) THEN
    ALTER TABLE progress DROP CONSTRAINT progress_track_id_module_id_lesson_id_key;
  END IF;

  -- Add the new 4-column constraint if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'progress' AND c.contype = 'u'
      AND c.conname = 'progress_user_track_module_lesson_key'
  ) THEN
    ALTER TABLE progress ADD CONSTRAINT progress_user_track_module_lesson_key
      UNIQUE (user_id, track_id, module_id, lesson_id);
  END IF;
END $$;
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
