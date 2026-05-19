import "dotenv/config";
import express from "express";
import cors from "cors";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { checkConnection } from "./db/pool.js";
import { runMigration } from "./db/migrate.js";
import { requestLogger } from "./middleware/request-logger.js";
import { errorHandler } from "./middleware/error-handler.js";

import healthRouter from "./routes/health.js";
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

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use("/api", healthRouter);
app.use("/api", progressRouter);
app.use("/api", settingsRouter);
app.use("/api", weakAreasRouter);
app.use("/api", attemptsRouter);
app.use("/api", flociRouter);
app.use("/api", validateRouter);
app.use("/api", validatePythonRouter);
app.use("/api", aiRouter);

// Serve React SPA (production only — dev uses Vite's dev server)
const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "../public");
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // Catch-all: return index.html for SPA client-side routing
  app.get("*", (_req, res) => {
    res.sendFile(join(publicDir, "index.html"));
  });
}

// Global error handler (must be last)
app.use(errorHandler);

// Boot
async function start(): Promise<void> {
  await checkConnection();   // retries up to 5x with 2s delay
  await runMigration();      // idempotent — safe to run on every boot
  app.listen(PORT, () => {
    console.log(`Floci Trainer Web API running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
