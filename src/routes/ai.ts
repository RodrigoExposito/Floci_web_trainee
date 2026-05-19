import { Router, Request, Response } from "express";
import { callGroq, AiError } from "../services/ai.js";

const router = Router();

async function handleAiChat(req: Request, res: Response): Promise<void> {
  const { prompt, context, track_id } = req.body as Record<string, unknown>;

  if (typeof prompt !== "string" || prompt.trim() === "") {
    res.status(400).json({
      ok: false,
      error: { code: "INVALID_BODY", message: "prompt is required" },
    });
    return;
  }

  const trackId = typeof track_id === "string" ? track_id : "aws";
  const contextStr = typeof context === "string" ? context : "";

  try {
    const response = await callGroq(prompt.trim(), contextStr, trackId);
    res.json({ ok: true, data: { response } });
  } catch (err) {
    if (err instanceof AiError) {
      const status = err.code === "NO_API_KEY" ? 503
        : err.code === "RATE_LIMIT" ? 429
        : 502;
      res.status(status).json({
        ok: false,
        error: { code: err.code, message: err.message },
      });
      return;
    }
    res.status(502).json({
      ok: false,
      error: { code: "GROQ_ERROR", message: String(err) },
    });
  }
}

// POST /api/ai/chat  (mounted at /api/ai → path here is /chat)
// POST /api/ai/hint  (backward-compat alias)
router.post("/chat", (req, res) => { void handleAiChat(req, res); });
router.post("/hint", (req, res) => { void handleAiChat(req, res); });

export default router;
