import "dotenv/config";
import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { checkConnection } from "./db/pool.js";
import { runMigration } from "./db/migrate.js";
import { requestLogger } from "./middleware/request-logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authMiddleware } from "./middleware/auth.js";

import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import progressRouter from "./routes/progress.js";
import settingsRouter from "./routes/settings.js";
import weakAreasRouter from "./routes/weak-areas.js";
import attemptsRouter from "./routes/attempts.js";
import flociRouter from "./routes/floci.js";
import validateRouter from "./routes/validate.js";
import validatePythonRouter from "./routes/validate-python.js";
import aiRouter from "./routes/ai.js";

const app = express();
const PORT = process.env["PORT"] ?? 3000;

// ── CORS ──────────────────────────────────────────────────────────────────────
// ALLOWED_ORIGINS: comma-separated list. If unset, allow all (dev mode).
const allowedOrigins = process.env["ALLOWED_ORIGINS"]
  ? process.env["ALLOWED_ORIGINS"].split(",").map((s) => s.trim())
  : null;

app.use(
  cors({
    origin: allowedOrigins
      ? (origin, cb) => {
          // Allow requests with no origin (same-origin, server-to-server)
          if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
          cb(new Error(`CORS: origin ${origin} not allowed`));
        }
      : true,
    credentials: true,
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { ok: false, error: { code: "RATE_LIMITED", message: "Demasiadas solicitudes. Esperá un momento." } },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { ok: false, error: { code: "RATE_LIMITED", message: "Límite de consultas al asistente alcanzado. Esperá unos minutos." } },
});

const validateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { ok: false, error: { code: "RATE_LIMITED", message: "Demasiadas validaciones. Esperá un momento." } },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(globalLimiter);
app.use(express.json());
app.use(requestLogger);

// ── Public routes (no auth required) ─────────────────────────────────────────
app.use("/api", healthRouter);
app.use("/api", authRouter);

// ── Protected routes ──────────────────────────────────────────────────────────
app.use("/api", authMiddleware);
app.use("/api", progressRouter);
app.use("/api", settingsRouter);
app.use("/api", weakAreasRouter);
app.use("/api", attemptsRouter);
app.use("/api", flociRouter);
app.use("/api/validate", validateLimiter, validateRouter);
app.use("/api/validate", validateLimiter, validatePythonRouter);
app.use("/api/ai", aiLimiter, aiRouter);

// ── Serve React SPA (production only — dev uses Vite's dev server) ────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "../public");
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // Catch-all: return index.html for SPA client-side routing
  app.get("*", (_req, res) => {
    res.sendFile(join(publicDir, "index.html"));
  });
}

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────────────────────────
async function start(): Promise<void> {
  await checkConnection();  // retries up to 5x with 2s delay
  await runMigration();     // idempotent — safe to run on every boot
  app.listen(PORT, () => {
    console.log(`Floci Trainer Web API running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
