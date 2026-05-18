# Floci Trainer Web — Backend

This is the **web backend** for Floci Trainer, a structured AWS and AI Agents learning app.
The desktop version (Tauri + Rust + SQLite) lives in `../floci-trainer`.

---

## Stack

- **Runtime:** Node.js 20
- **Framework:** Express 4 + TypeScript (strict)
- **Database:** PostgreSQL 16 via `pg` (node-postgres)
- **Package manager:** pnpm
- **Deploy target:** Railway (nixpacks build)

---

## Folder Structure

```
src/
├── index.ts              # Express entrypoint — boot, middleware, route mounting
├── middleware/
│   ├── error-handler.ts  # Global error handler (must be last middleware)
│   └── request-logger.ts # Log method, path, status, latency
├── routes/
│   ├── health.ts         # GET /api/health
│   ├── progress.ts       # GET + POST /api/progress
│   ├── settings.ts       # GET + PUT /api/settings/:key
│   ├── weak-areas.ts     # GET + POST /api/weak-areas
│   └── attempts.ts       # POST /api/attempts
├── db/
│   ├── pool.ts           # pg.Pool singleton, reads DATABASE_URL, exits if missing
│   ├── schema.sql        # CREATE TABLE IF NOT EXISTS for all 4 tables
│   └── migrate.ts        # Runs schema.sql idempotently, then closes pool
├── services/             # Business logic (empty in W1 — populated from W2 onward)
└── types/
    └── index.ts          # Shared TS interfaces (ProgressRecord, Setting, etc.)
```

---

## Database Schema

```sql
progress          (id, track_id, module_id, lesson_id, status, completed_at)
                  UNIQUE(track_id, module_id, lesson_id)

challenge_attempts (id, track_id, challenge_id, attempt_number, passed, feedback, created_at)

settings          (key PK, value)

weak_areas        (id, track_id, module_id, topic, miss_count)
```

---

## API Endpoints

All under `/api`:

| Method | Path                    | Body / Query                                                        |
|--------|-------------------------|---------------------------------------------------------------------|
| GET    | `/health`               | —                                                                   |
| GET    | `/progress`             | `?track=<trackId>`                                                  |
| POST   | `/progress`             | `{ track_id, module_id, lesson_id, status }`                        |
| GET    | `/settings/:key`        | —                                                                   |
| PUT    | `/settings/:key`        | `{ value }`                                                         |
| GET    | `/weak-areas`           | `?track=<trackId>`                                                  |
| POST   | `/weak-areas`           | `{ track_id, module_id, topic, miss_count }`                        |
| POST   | `/attempts`             | `{ track_id, challenge_id, passed, feedback }`                      |

All responses follow `{ ok: true, data: ... }` or `{ ok: false, error: { code, message } }`.

---

## Environment Variables

| Variable       | Description                                   |
|----------------|-----------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string (required)       |
| `PORT`         | Listening port (default: 3000)                |

---

## Code Style

- TypeScript strict — no `any`, use `unknown` and narrow
- `async/await` exclusively, no `.then()` chains
- Validate all external input at the route boundary; reject with 400 + structured error
- No barrel files, no default exports (except where Express conventions require)
- Files < 200 lines; extract if they grow

---

## Phase Status

- [x] **W1 — Backend Foundation:** Express + TypeScript, PostgreSQL schema, 8 REST endpoints, Docker Compose for local dev, Railway deploy config
- [ ] **W2 — Content API:** Serve curriculum JSON + Markdown lesson content from static files
- [ ] **W3 — Challenge Execution:** Run AWS CLI commands against Floci, return validation results
- [ ] **W4 — AI Integration:** Proxy Groq API calls (hints, explanations, feedback)
- [ ] **W5 — Frontend:** React SPA served from the same Express app or Vite + CDN
