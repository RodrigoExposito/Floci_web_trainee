import { Router, Request, Response } from "express";
import { pool } from "../db/pool.js";
import type { WeakArea } from "../types/index.js";

const router = Router();

// GET /api/weak-areas?track=:trackId
router.get("/weak-areas", async (req: Request, res: Response) => {
  const trackId = req.query["track"];
  if (typeof trackId !== "string" || trackId.trim() === "") {
    res.status(400).json({ ok: false, error: { code: "MISSING_TRACK", message: "Query param 'track' is required" } });
    return;
  }

  const result = await pool.query<WeakArea>(
    `SELECT id, track_id, module_id, topic, miss_count
     FROM weak_areas
     WHERE user_id = $1 AND track_id = $2
     ORDER BY miss_count DESC`,
    [req.userId, trackId]
  );
  res.json({ ok: true, data: result.rows });
});

// POST /api/weak-areas — upsert (topic per user+track+module)
router.post("/weak-areas", async (req: Request, res: Response) => {
  const { track_id, module_id, topic, miss_count } = req.body as Record<string, unknown>;

  if (
    typeof track_id !== "string" || track_id.trim() === "" ||
    typeof module_id !== "string" || module_id.trim() === "" ||
    typeof topic !== "string" || topic.trim() === "" ||
    typeof miss_count !== "number" || !Number.isInteger(miss_count)
  ) {
    res.status(400).json({
      ok: false,
      error: {
        code: "INVALID_BODY",
        message: "Required: track_id (string), module_id (string), topic (string), miss_count (integer)",
      },
    });
    return;
  }

  const existing = await pool.query<WeakArea>(
    "SELECT id FROM weak_areas WHERE user_id = $1 AND track_id = $2 AND module_id = $3 AND topic = $4",
    [req.userId, track_id, module_id, topic]
  );

  let row: WeakArea;
  if ((existing.rowCount ?? 0) > 0) {
    const updated = await pool.query<WeakArea>(
      `UPDATE weak_areas SET miss_count = $1
       WHERE id = $2
       RETURNING id, track_id, module_id, topic, miss_count`,
      [miss_count, existing.rows[0]?.id]
    );
    row = updated.rows[0] as WeakArea;
  } else {
    const inserted = await pool.query<WeakArea>(
      `INSERT INTO weak_areas (user_id, track_id, module_id, topic, miss_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, track_id, module_id, topic, miss_count`,
      [req.userId, track_id, module_id, topic, miss_count]
    );
    row = inserted.rows[0] as WeakArea;
  }

  res.status(201).json({ ok: true, data: row });
});

export default router;
