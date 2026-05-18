-- Floci Trainer Web — Database Schema
-- Idempotent: safe to run multiple times (CREATE TABLE IF NOT EXISTS)

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
