import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: number;
  username: string;
  displayName: string;
}

export const authMiddleware: RequestHandler = (req, res, next) => {
  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    res.status(500).json({
      ok: false,
      error: { code: "SERVER_MISCONFIGURED", message: "JWT_SECRET is not configured" },
    });
    return;
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Autenticación requerida" },
    });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.userId = payload.userId;
    req.username = payload.username;
    next();
  } catch {
    res.status(401).json({
      ok: false,
      error: { code: "INVALID_TOKEN", message: "Token inválido o expirado" },
    });
  }
};
