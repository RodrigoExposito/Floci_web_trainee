import { Router, Request, Response } from "express";
import { pool } from "../db/pool.js";
import type { ProgressRecord } from "../types/index.js";

const router = Router();

// GET /api/progress?track=:trackId
router.get("/progress", async (req: Request, res: Response) => {
  const trackId = req.query["track"];
  if (typeof trackId !== "string" || trackId.trim() === "") {
    res.status(400).json({ ok: false, error: { code: "MISSING_TRACK", message: "Query param 'track' is required" } });
    return;
  }

  const result = await pool.query<ProgressRecord>(
    "SELECT id, track_id, module_id, lesson_id, status, completed_at FROM progress WHERE track_id = $1 ORDER BY id",
    [trackId]
  );
  res.json({ ok: true, data: result.rows });
});

// POST /api/progress — upsert
router.post("/progress", async (req: Request, res: Response) => {
  const { track_id, module_id, lesson_id, status } = req.body as Record<string, unknown>;

  if (
    typeof track_id !== "string" || track_id.trim() === "" ||
    typeof module_id !== "string" || module_id.trim() === "" ||
    typeof lesson_id !== "string" || lesson_id.trim() === "" ||
    typeof status !== "string" || !["locked", "active", "completed"].includes(status)
  ) {
    res.status(400).json({
      ok: false,
      error: {
        code: "INVALID_BODY",
        message: "Required: track_id, module_id, lesson_id, status (locked|active|completed)",
      },
    });
    return;
  }

  const completedAt = status === "completed" ? new Date().toISOString() : null;

  const result = await pool.query<ProgressRecord>(
    `INSERT INTO progress (track_id, module_id, lesson_id, status, completed_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (track_id, module_id, lesson_id)
     DO UPDATE SET status = EXCLUDED.status, completed_at = EXCLUDED.completed_at
     RETURNING id, track_id, module_id, lesson_id, status, completed_at`,
    [track_id, module_id, lesson_id, status, completedAt]
  );

  res.status(201).json({ ok: true, data: result.rows[0] });
});

export default router;
