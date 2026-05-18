import { Router, Request, Response } from "express";
import { pool } from "../db/pool.js";
import type { Setting } from "../types/index.js";

const router = Router();

// GET /api/settings/:key
router.get("/settings/:key", async (req: Request, res: Response) => {
  const { key } = req.params as { key: string };

  const result = await pool.query<Setting>(
    "SELECT key, value FROM settings WHERE key = $1",
    [key]
  );

  if (result.rowCount === 0) {
    res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: `Setting '${key}' not found` } });
    return;
  }

  res.json({ ok: true, data: result.rows[0] });
});

// PUT /api/settings/:key
router.put("/settings/:key", async (req: Request, res: Response) => {
  const { key } = req.params as { key: string };
  const { value } = req.body as Record<string, unknown>;

  if (typeof value !== "string") {
    res.status(400).json({ ok: false, error: { code: "INVALID_BODY", message: "'value' must be a string" } });
    return;
  }

  const result = await pool.query<Setting>(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
     RETURNING key, value`,
    [key, value]
  );

  res.json({ ok: true, data: result.rows[0] });
});

export default router;
