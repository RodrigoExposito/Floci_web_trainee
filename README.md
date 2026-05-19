# Floci Trainer Web

A structured AWS and AI Agents learning platform for the Nave team. Built as the web version of [Floci Trainer](https://github.com/), it guides users through a hands-on curriculum validated against a local AWS emulator (Floci / LocalStack), with an AI assistant powered by Groq.

---

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Node.js 20 + Express + TypeScript (strict)
- **Database:** PostgreSQL 16
- **AI:** Groq API (`llama-3.3-70b-versatile`)
- **AWS emulator:** [Floci](https://github.com/hectorvent/floci) (LocalStack-compatible)
- **Package manager:** pnpm

---

## Local development

### 1. Start PostgreSQL and Floci via Docker

```bash
docker compose up -d
```

Starts Postgres 16 at `localhost:5432` and Floci at `localhost:4566`.

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set JWT_SECRET and GROQ_API_KEY
```

### 3. Install, migrate, and seed

```bash
pnpm install
pnpm run migrate   # creates tables
pnpm run seed      # creates the 9 team users (idempotent)
```

### 4. Start the dev server

```bash
pnpm dev
```

API at `http://localhost:3000`. The frontend runs separately via `cd frontend && pnpm dev` (Vite dev server on `http://localhost:5173`, proxies `/api` to port 3000).

---

## Environment variables

| Variable          | Required | Description                                                     |
|-------------------|----------|-----------------------------------------------------------------|
| `DATABASE_URL`    | Yes      | PostgreSQL connection string                                    |
| `JWT_SECRET`      | Yes      | Secret for signing JWTs — `openssl rand -hex 32`                |
| `GROQ_API_KEY`    | Yes      | Groq API key (`gsk_...`) for the AI assistant                   |
| `PORT`            | No       | Listening port (default: `3000`)                               |
| `FLOCI_ENDPOINT`  | No       | Floci base URL (default: `http://localhost:4566`)               |
| `ALLOWED_ORIGINS` | No       | Comma-separated CORS allowlist; all origins allowed if unset   |

---

## API endpoints

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Path                        | Auth | Description                                   |
|--------|-----------------------------|------|-----------------------------------------------|
| GET    | `/api/health`               | No   | Server + DB liveness check                    |
| POST   | `/api/auth/login`           | No   | Login with username + password → JWT          |
| GET    | `/api/progress?track=`      | Yes  | List progress for the authenticated user      |
| POST   | `/api/progress`             | Yes  | Upsert a progress record                      |
| DELETE | `/api/progress?track=&module=` | Yes | Reset one module's progress                |
| DELETE | `/api/progress/all?track=`  | Yes  | Reset all progress for a track                |
| GET    | `/api/weak-areas?track=`    | Yes  | List weak areas for the authenticated user    |
| POST   | `/api/weak-areas`           | Yes  | Upsert a weak area record                     |
| POST   | `/api/attempts`             | Yes  | Record a challenge attempt                    |
| GET    | `/api/floci/status`         | Yes  | Check if Floci is running                     |
| POST   | `/api/validate/aws/single`  | Yes  | Run a single AWS CLI validation               |
| POST   | `/api/validate/aws`         | Yes  | Run a full challenge AWS validation suite     |
| POST   | `/api/validate/python`      | Yes  | Run and validate a Python challenge           |
| POST   | `/api/ai/chat`              | Yes  | AI assistant chat via Groq                    |

---

## Scripts

| Script                | Description                                          |
|-----------------------|------------------------------------------------------|
| `pnpm dev`            | Dev server with hot-reload (`tsx watch`)             |
| `pnpm build`          | Compile TypeScript to `dist/`                        |
| `pnpm start`          | Run compiled output                                  |
| `pnpm run migrate`    | Run DB migrations (idempotent)                       |
| `pnpm run seed`       | Create team users in DB (idempotent)                 |
| `pnpm run start:prod` | Migrate + start (used in production)                 |
| `pnpm run typecheck`  | Type-check without emitting                          |

---

## Deploy on Railway

1. Create a Railway project and add a **PostgreSQL** plugin.
2. Set `JWT_SECRET`, `GROQ_API_KEY`, and `ALLOWED_ORIGINS` as environment variables.
3. Add a second service for Floci using image `hectorvent/floci:latest`; set `FLOCI_ENDPOINT` to its internal Railway URL.
4. Deploy this repo — Railway uses the `Dockerfile` to build the full app (backend + frontend).
5. After first deploy, run `pnpm run seed` once via Railway's shell to create team users.

---

## Credits

Built by **[Nave Merchant Protection](https://www.nave.com.ar)** and **Rodrigo Expósito** as an internal learning tool for the engineering team.

This project builds on the work of several open-source projects and tools:

- **[Floci / LocalStack](https://github.com/hectorvent/floci)** by Héctor Ventura — the AWS emulator that makes local practice possible
- **[Groq](https://groq.com)** — fast LLM inference powering the AI assistant
- **[Vite](https://vitejs.dev)**, **[React](https://react.dev)**, **[Tailwind CSS](https://tailwindcss.com)**, **[shadcn/ui](https://ui.shadcn.com)** — frontend tooling
- **[Express](https://expressjs.com)**, **[node-postgres](https://node-postgres.com)**, **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)**, **[jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)** — backend foundation
- **[Claude](https://claude.ai) by Anthropic** — AI pair programmer used throughout the development of this project
