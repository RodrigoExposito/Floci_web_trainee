import { RequestHandler } from "express";
import { deriveToken } from "../services/ai.js";

export const authMiddleware: RequestHandler = (req, res, next) => {
  const accessPassword = process.env["ACCESS_PASSWORD"];

  // No ACCESS_PASSWORD set → dev mode, skip auth
  if (!accessPassword) {
    next();
    return;
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  const token = authHeader.slice(7);
  if (token !== deriveToken(accessPassword)) {
    res.status(401).json({
      ok: false,
      error: { code: "INVALID_TOKEN", message: "Invalid token" },
    });
    return;
  }

  next();
};
