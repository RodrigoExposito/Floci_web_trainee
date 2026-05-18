import { Router, Request, Response } from "express";
import { checkFlociStatus, cleanupResource } from "../services/floci.js";
import type { CleanupResource, CleanupResourceType } from "../types/index.js";

const router = Router();

const VALID_RESOURCE_TYPES = new Set<CleanupResourceType>([
  "s3-bucket",
  "sqs-queue",
  "dynamodb-table",
  "lambda-function",
]);

// GET /api/floci/status
router.get("/floci/status", async (_req: Request, res: Response) => {
  const running = await checkFlociStatus();
  if (running) {
    res.json({ ok: true, data: { running: true } });
  } else {
    res.status(503).json({
      ok: false,
      error: { code: "FLOCI_UNAVAILABLE", message: "Floci no está disponible" },
    });
  }
});

// POST /api/floci/cleanup
router.post("/floci/cleanup", async (req: Request, res: Response) => {
  const { track_id, challenge_id, resources } = req.body as Record<string, unknown>;

  if (!Array.isArray(resources) || resources.length === 0) {
    res.status(400).json({
      ok: false,
      error: { code: "INVALID_BODY", message: "'resources' must be a non-empty array" },
    });
    return;
  }

  // Validate each resource entry
  for (const r of resources as unknown[]) {
    if (
      typeof r !== "object" || r === null ||
      !("type" in r) || !("name" in r) ||
      typeof (r as Record<string, unknown>)["type"] !== "string" ||
      typeof (r as Record<string, unknown>)["name"] !== "string" ||
      !VALID_RESOURCE_TYPES.has((r as Record<string, unknown>)["type"] as CleanupResourceType)
    ) {
      res.status(400).json({
        ok: false,
        error: {
          code: "INVALID_RESOURCE",
          message: `Each resource must have type (${[...VALID_RESOURCE_TYPES].join("|")}) and name (string)`,
        },
      });
      return;
    }
  }

  const running = await checkFlociStatus();
  if (!running) {
    res.status(503).json({
      ok: false,
      error: { code: "FLOCI_UNAVAILABLE", message: "Floci no está disponible" },
    });
    return;
  }

  console.log(`Cleanup requested — track: ${String(track_id)}, challenge: ${String(challenge_id)}`);

  const cleaned: string[] = [];
  const errors: string[] = [];

  for (const resource of resources as CleanupResource[]) {
    try {
      await cleanupResource(resource);
      cleaned.push(`${resource.type}:${resource.name}`);
    } catch (err) {
      errors.push(`${resource.type}:${resource.name} — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  res.json({ ok: true, data: { cleaned, errors } });
});

export default router;
