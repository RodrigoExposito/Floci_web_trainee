# Floci Trainer Web — Backend API

REST API backend for the web version of [Floci Trainer](https://github.com/), a structured AWS and AI Agents learning app. Persists progress, settings, challenge attempts, and weak areas in PostgreSQL.

## Stack

- Node.js 20 + Express + TypeScript (strict)
- PostgreSQL 16
- pnpm

## Local development

### 1. Start PostgreSQL via Docker

```bash
docker compose up -d
```

This starts a Postgres 16 instance at `localhost:5432` with:
- User: `postgres`
- Password: `postgres`
- Database: `floci_trainer`

### 2. Configure environment

```bash
cp .env.example .env
# .env already points to the local Docker Postgres — no changes needed for local dev
```

### 3. Install dependencies and run migrations

```bash
pnpm install
pnpm run migrate
```

### 4. Start the dev server

```bash
pnpm dev
```

The server starts at `http://localhost:3000`. It watches for file changes via `tsx`.

---

## Environment variables

| Variable       | Required | Description                                      |
|----------------|----------|--------------------------------------------------|
| `DATABASE_URL` | Yes      | PostgreSQL connection string                     |
| `PORT`         | No       | Port to listen on (default: `3000`)              |

---

## API endpoints

All routes are prefixed with `/api`.

| Method | Path                    | Description                                     |
|--------|-------------------------|-------------------------------------------------|
| GET    | `/api/health`           | Server + DB liveness check                      |
| GET    | `/api/progress?track=`  | List progress records for a track               |
| POST   | `/api/progress`         | Upsert a progress record                        |
| GET    | `/api/settings/:key`    | Get a setting by key                            |
| PUT    | `/api/settings/:key`    | Upsert a setting                                |
| GET    | `/api/weak-areas?track=`| List weak areas for a track                     |
| POST   | `/api/weak-areas`       | Upsert a weak area record                       |
| POST   | `/api/attempts`         | Record a challenge attempt (auto-increments #)  |

---

## Deploy on Railway

1. Create a new Railway project.
2. Add a **PostgreSQL** plugin — Railway automatically injects `DATABASE_URL`.
3. Connect this repository (or push from CLI).
4. Railway uses `nixpacks.toml` to build and start the app via `pnpm run start:prod`, which runs migrations then starts the server.
5. No extra environment variables needed beyond what Railway injects.

---

## Scripts

| Script              | Description                                    |
|---------------------|------------------------------------------------|
| `pnpm dev`          | Dev server with hot-reload (tsx watch)         |
| `pnpm build`        | Compile TypeScript to `dist/`                  |
| `pnpm start`        | Run compiled output (no migration)             |
| `pnpm run migrate`  | Run DB migrations (idempotent)                 |
| `pnpm run start:prod` | Migrate then start (used in production)      |
| `pnpm run typecheck`| Type-check without emitting                    |
