import "dotenv/config";
import express from "express";
import cors from "cors";

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
