import { Router, Request, Response } from "express";
import { pool } from "../db/pool.js";
import type { ChallengeAttempt } from "../types/index.js";

const router = Router();

// POST /api/attempts — register attempt, auto-increment attempt_number per challenge
router.post("/attempts", async (req: Request, res: Response) => {
  const { track_id, challenge_id, passed, feedback } = req.body as Record<string, unknown>;

  if (
    typeof track_id !== "string" || track_id.trim() === "" ||
    typeof challenge_id !== "string" || challenge_id.trim() === "" ||
    typeof passed !== "boolean" ||
    typeof feedback !== "string"
  ) {
    res.status(400).json({
      ok: false,
      error: {
        code: "INVALID_BODY",
        message: "Required: track_id (string), challenge_id (string), passed (boolean), feedback (string)",
      },
    });
    return;
  }

  // Compute next attempt_number for this challenge
  const countResult = await pool.query<{ count: string }>(
    "SELECT COUNT(*) AS count FROM challenge_attempts WHERE track_id = $1 AND challenge_id = $2",
    [track_id, challenge_id]
  );
  const nextAttempt = parseInt(countResult.rows[0]?.count ?? "0", 10) + 1;

  const result = await pool.query<ChallengeAttempt>(
    `INSERT INTO challenge_attempts (track_id, challenge_id, attempt_number, passed, feedback)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, track_id, challenge_id, attempt_number, passed, feedback, created_at`,
    [track_id, challenge_id, nextAttempt, passed, feedback]
  );

  res.status(201).json({ ok: true, data: result.rows[0] });
});

export default router;
