import { Router, Request, Response } from "express";
import { pool } from "../db/pool.js";
import { runPython } from "../services/python-runner.js";
import type { PythonRunResult, PythonValidation } from "../types/index.js";

const router = Router();

function evaluatePython(expect: string, result: PythonRunResult): boolean {
  if (expect === "exit_code_0") return result.exitCode === 0;
  if (expect.startsWith("stdout_contains:")) {
    const needle = expect.slice("stdout_contains:".length);
    return result.stdout.toLowerCase().includes(needle.toLowerCase());
  }
  if (expect === "no_exception") {
    return !result.stderr.includes("Traceback");
  }
  return false;
}

function isPythonValidation(v: unknown): v is PythonValidation {
  return (
    typeof v === "object" && v !== null &&
    typeof (v as Record<string, unknown>)["expect"] === "string" &&
    typeof (v as Record<string, unknown>)["criterion"] === "string"
  );
}

async function recordAttempt(
  userId: number,
  trackId: string,
  challengeId: string,
  passed: boolean,
  feedback: unknown
): Promise<void> {
  const countResult = await pool.query<{ count: string }>(
    "SELECT COUNT(*) AS count FROM challenge_attempts WHERE user_id = $1 AND track_id = $2 AND challenge_id = $3",
    [userId, trackId, challengeId]
  );
  const nextAttempt = parseInt(countResult.rows[0]?.count ?? "0", 10) + 1;
  await pool.query(
    `INSERT INTO challenge_attempts (user_id, track_id, challenge_id, attempt_number, passed, feedback)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, trackId, challengeId, nextAttempt, passed, JSON.stringify(feedback)]
  );
}

// POST /api/validate/python
router.post("/validate/python", async (req: Request, res: Response) => {
  const { track_id, challenge_id, code, validations } = req.body as Record<string, unknown>;

  if (
    typeof track_id !== "string" || track_id.trim() === "" ||
    typeof challenge_id !== "string" || challenge_id.trim() === "" ||
    typeof code !== "string" ||
    !Array.isArray(validations) || validations.length === 0
  ) {
    res.status(400).json({
      ok: false,
      error: {
        code: "INVALID_BODY",
        message: "Required: track_id, challenge_id (strings), code (string), validations (non-empty array)",
      },
    });
    return;
  }

  for (const v of validations as unknown[]) {
    if (!isPythonValidation(v)) {
      res.status(400).json({
        ok: false,
        error: {
          code: "INVALID_VALIDATION",
          message: "Each validation must have expect (string) and criterion (string)",
        },
      });
      return;
    }
  }

  const runResult = await runPython(code);

  const results = (validations as PythonValidation[]).map((v) => ({
    criterion: v.criterion,
    passed: evaluatePython(v.expect, runResult),
    actual_output: runResult.stdout || runResult.stderr,
  }));

  const allPassed = results.every((r) => r.passed);

  // Record attempt — non-fatal if DB write fails
  try {
    await recordAttempt(req.userId, track_id, challenge_id, allPassed, { results });
  } catch (err) {
    console.error("Failed to record Python attempt:", err);
  }

  res.json({
    ok: true,
    data: {
      results,
      allPassed,
      stdout: runResult.stdout,
      stderr: runResult.stderr,
      timedOut: runResult.timedOut,
    },
  });
});

export default router;
