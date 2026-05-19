import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import type { User } from "../types/index.js";

const router = Router();

// POST /api/auth/login
// Body: { username: string, password: string }
// Returns: { ok: true, data: { token: string, username: string, displayName: string } }
router.post("/auth/login", async (req: Request, res: Response) => {
  const { username, password } = req.body as Record<string, unknown>;

  if (
    typeof username !== "string" || username.trim() === "" ||
    typeof password !== "string" || password === ""
  ) {
    res.status(400).json({
      ok: false,
      error: { code: "INVALID_BODY", message: "Se requieren username y password" },
    });
    return;
  }

  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    res.status(500).json({
      ok: false,
      error: { code: "SERVER_MISCONFIGURED", message: "JWT_SECRET is not configured" },
    });
    return;
  }

  const result = await pool.query<User>(
    "SELECT id, username, password_hash, display_name FROM users WHERE username = $1",
    [username.trim().toLowerCase()]
  );

  const user = result.rows[0];
  if (!user) {
    res.status(401).json({
      ok: false,
      error: { code: "INVALID_CREDENTIALS", message: "Usuario o contraseña incorrectos" },
    });
    return;
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) {
    res.status(401).json({
      ok: false,
      error: { code: "INVALID_CREDENTIALS", message: "Usuario o contraseña incorrectos" },
    });
    return;
  }

  const displayName = user.display_name ?? user.username;
  const token = jwt.sign(
    { userId: user.id, username: user.username, displayName },
    secret,
    { expiresIn: "30d" }
  );

  res.json({
    ok: true,
    data: { token, username: user.username, displayName },
  });
});

export default router;
