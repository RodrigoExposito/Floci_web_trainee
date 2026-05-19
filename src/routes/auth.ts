import { Router, Request, Response } from "express";
import { deriveToken } from "../services/ai.js";

const router = Router();

// POST /api/auth/login
// Body: { password: string }
// Returns: { ok: true, data: { token: string } }
router.post("/auth/login", (req: Request, res: Response) => {
  const { password } = req.body as Record<string, unknown>;
  const accessPassword = process.env["ACCESS_PASSWORD"];

  if (!accessPassword) {
    // No password configured → dev mode, return a dummy token
    res.json({ ok: true, data: { token: "dev-mode" } });
    return;
  }

  if (typeof password !== "string" || password !== accessPassword) {
    res.status(401).json({
      ok: false,
      error: { code: "INVALID_PASSWORD", message: "Clave incorrecta" },
    });
    return;
  }

  const token = deriveToken(accessPassword);
  res.json({ ok: true, data: { token } });
});

export default router;
