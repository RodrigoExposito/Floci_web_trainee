import { Router, Request, Response } from "express";
import { checkFlociStatus, executeAwsCommand, evaluateExpect } from "../services/floci.js";
import type { ValidationCommand, ValidationResult } from "../types/index.js";

const router = Router();

function isValidationCommand(v: unknown): v is ValidationCommand {
  return (
    typeof v === "object" && v !== null &&
    typeof (v as Record<string, unknown>)["cmd"] === "string" &&
    typeof (v as Record<string, unknown>)["expect"] === "string" &&
    typeof (v as Record<string, unknown>)["criterion"] === "string"
  );
}

async function assertFlociAvailable(res: Response): Promise<boolean> {
  const running = await checkFlociStatus();
  if (!running) {
    res.status(503).json({
      ok: false,
      error: { code: "FLOCI_UNAVAILABLE", message: "Floci no está disponible" },
    });
    return false;
  }
  return true;
}

// POST /api/validate/aws/single
router.post("/validate/aws/single", async (req: Request, res: Response) => {
  const { cmd, expect } = req.body as Record<string, unknown>;

  if (typeof cmd !== "string" || cmd.trim() === "" || typeof expect !== "string") {
    res.status(400).json({
      ok: false,
      error: { code: "INVALID_BODY", message: "Required: cmd (string), expect (string)" },
    });
    return;
  }

  if (!await assertFlociAvailable(res)) return;

  const result = await executeAwsCommand(cmd);
  const passed = evaluateExpect(expect, result);

  res.json({
    ok: true,
    data: { passed, actual_output: result.stdout || result.stderr },
  });
});

// POST /api/validate/aws
router.post("/validate/aws", async (req: Request, res: Response) => {
  const { track_id, challenge_id, commands } = req.body as Record<string, unknown>;

  if (
    typeof track_id !== "string" || track_id.trim() === "" ||
    typeof challenge_id !== "string" || challenge_id.trim() === "" ||
    !Array.isArray(commands) || commands.length === 0
  ) {
    res.status(400).json({
      ok: false,
      error: {
        code: "INVALID_BODY",
        message: "Required: track_id, challenge_id (strings), commands (non-empty array)",
      },
    });
    return;
  }

  for (const c of commands as unknown[]) {
    if (!isValidationCommand(c)) {
      res.status(400).json({
        ok: false,
        error: {
          code: "INVALID_COMMAND",
          message: "Each command must have cmd, expect, and criterion (all strings)",
        },
      });
      return;
    }
  }

  if (!await assertFlociAvailable(res)) return;

  const results: ValidationResult[] = [];

  for (const command of commands as ValidationCommand[]) {
    const result = await executeAwsCommand(command.cmd);
    const passed = evaluateExpect(command.expect, result);
    results.push({
      criterion: command.criterion,
      passed,
      actual_output: result.stdout || result.stderr,
    });
  }

  const allPassed = results.every((r) => r.passed);
  res.json({ ok: true, data: { results, allPassed } });
});

export default router;
