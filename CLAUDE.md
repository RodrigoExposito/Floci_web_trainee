# Floci Trainer Web — Backend

This is the **web backend** for Floci Trainer, a structured AWS and AI Agents learning app.
The desktop version (Tauri + Rust + SQLite) lives in `../floci-trainer`.

---

## Stack

- **Runtime:** Node.js 20
- **Framework:** Express 4 + TypeScript (strict)
- **Database:** PostgreSQL 16 via `pg` (node-postgres)
- **Package manager:** pnpm
- **Deploy target:** Railway (Dockerfile build — `railway.json` forces `DOCKERFILE` builder)

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
│   ├── attempts.ts       # POST /api/attempts
│   ├── floci.ts          # GET /api/floci/status, POST /api/floci/cleanup
│   ├── validate.ts       # POST /api/validate/aws, POST /api/validate/aws/single
│   └── validate-python.ts # POST /api/validate/python
├── db/
│   ├── pool.ts           # pg.Pool singleton with retry; reads DATABASE_URL
│   ├── schema.sql        # Reference only — schema is embedded in migrate.ts
│   └── migrate.ts        # Idempotent migration; runMigration() exported
├── services/
│   ├── floci.ts          # checkFlociStatus, executeAwsCommand, evaluateExpect, cleanupResource
│   └── python-runner.ts  # runPython(code) — spawns python3, timeout 15s SIGKILL, cleans tmp file
└── types/
    └── index.ts          # Shared TS interfaces
```

### Floci Service (Railway)

Floci runs as a **separate Railway service** in the same project. The backend talks to it via Railway's internal network.

**floci-service/Dockerfile** — wraps `hectorvent/floci:latest` with service config:
```
floci-service/
└── Dockerfile   # FROM hectorvent/floci:latest, exposes 4566
```

**Deploying Floci on Railway:**
1. In your Railway project, click **+ New Service → Docker Image**
2. Use image: `hectorvent/floci:latest` (or point to `floci-service/Dockerfile`)
3. Set env vars: `DEFAULT_REGION=us-east-1`, `SERVICES=s3,sqs,lambda,dynamodb,...`
4. Note the internal hostname Railway assigns (e.g. `floci.railway.internal`)
5. In the backend service, set `FLOCI_ENDPOINT=http://floci.railway.internal:4566`

**Local dev:** `docker compose up -d` starts both Postgres and Floci.

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

### W2 Endpoints

| Method | Path                       | Body / Query                                                              |
|--------|----------------------------|---------------------------------------------------------------------------|
| GET    | `/api/floci/status`        | —                                                                         |
| POST   | `/api/floci/cleanup`       | `{ track_id, challenge_id, resources: [{type, name}] }`                  |
| POST   | `/api/validate/aws`        | `{ track_id, challenge_id, commands: [{cmd, expect, criterion}] }`       |
| POST   | `/api/validate/aws/single` | `{ cmd, expect }`                                                         |

**expect values:** `"exit_code_0"` or `"contains:<string>"` (case-insensitive).
**cleanup resource types:** `s3-bucket`, `sqs-queue`, `dynamodb-table`, `lambda-function`.
**503** is returned on any validation/cleanup endpoint when Floci is not available.

### W3 Endpoints

| Method | Path                    | Body                                                                                 |
|--------|-------------------------|--------------------------------------------------------------------------------------|
| POST   | `/api/validate/python`  | `{ track_id, challenge_id, code, validations: [{expect, criterion}] }`              |

**Python expect values:** `"exit_code_0"`, `"stdout_contains:X"` (case-insensitive), `"no_exception"` (checks for `Traceback` in stderr).
**Response:** `{ results, allPassed, stdout, stderr, timedOut }`. Attempt auto-recorded in `challenge_attempts`.
**Timeout:** 15s hard kill via SIGKILL. Code is written to a tmp file, executed with `python3`, tmp file deleted after.

---

## Environment Variables

| Variable       | Description                                   |
|----------------|-----------------------------------------------|
| `DATABASE_URL`      | PostgreSQL connection string (required)                                         |
| `PORT`              | Listening port (default: 3000)                                                  |
| `FLOCI_ENDPOINT`    | Floci base URL (default: `http://localhost:4566`)                                |
| `GROQ_API_KEY`      | Groq API key for the AI assistant — `gsk_...` (required for AI to work)         |
| `ACCESS_PASSWORD`   | Single-password access gate; if unset, auth is skipped (dev mode)               |
| `ALLOWED_ORIGINS`   | Comma-separated CORS allowlist; if unset, all origins allowed (dev mode)        |

---

## Code Style

- TypeScript strict — no `any`, use `unknown` and narrow
- `async/await` exclusively, no `.then()` chains
- Validate all external input at the route boundary; reject with 400 + structured error
- No barrel files, no default exports (except where Express conventions require)
- Files < 200 lines; extract if they grow

---

## Phase Status

- [x] **W1 — Backend Foundation:** Express + TypeScript, PostgreSQL schema, 8 REST endpoints, Docker Compose for local dev, Railway deploy via Dockerfile (`railway.json` + `Dockerfile`)
- [x] **W2 — Floci + AWS Validation:** Floci service (Railway), executeAwsCommand, evaluateExpect, cleanupResource, `/api/floci/status`, `/api/floci/cleanup`, `/api/validate/aws`, `/api/validate/aws/single`, AWS CLI v2 in Dockerfile
- [x] **W3 — Python Challenge Execution:** `runPython()` service, `/api/validate/python`, attempt recording, timeout via SIGKILL, python3 in Dockerfile
- [ ] **W4 — AI Integration:** Proxy Groq API calls (hints, explanations, feedback)
- [ ] **W5 — Frontend:** React SPA served from the same Express app or Vite + CDN
