import { Router, Request, Response } from "express";
import { pool } from "../db/pool.js";

const router = Router();

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

function systemPrompt(trackId: string): string {
  if (trackId === "agentes") {
    return `Sos un asistente de aprendizaje sobre agentes de IA integrado en Floci Trainer.
Respondé siempre en español. Sé conciso, didáctico y práctico.
Usá ejemplos de código Python cuando sea útil.
No des la solución directa a los challenges — guiá al estudiante con pistas.`;
  }
  return `Sos un asistente de aprendizaje AWS integrado en Floci Trainer, una app para
practicar AWS con un emulador local (Floci, compatible LocalStack).
Respondé siempre en español. Sé conciso, didáctico y práctico.
Usá ejemplos de AWS CLI cuando sea útil.
No des la solución directa a los challenges — guiá al estudiante con pistas.`;
}

// POST /api/ai/hint
router.post("/ai/hint", async (req: Request, res: Response) => {
  const { prompt, context, track_id } = req.body as Record<string, unknown>;

  if (typeof prompt !== "string" || prompt.trim() === "") {
    res.status(400).json({
      ok: false,
      error: { code: "INVALID_BODY", message: "prompt is required" },
    });
    return;
  }

  const trackId = typeof track_id === "string" ? track_id : "aws";

  // Read Groq API key from settings table
  let apiKey: string | null = null;
  try {
    const result = await pool.query<{ value: string }>(
      "SELECT value FROM settings WHERE key = $1",
      ["groq_api_key"]
    );
    apiKey = result.rows[0]?.value ?? null;
  } catch (err) {
    console.error("Failed to read groq_api_key from settings:", err);
  }

  if (!apiKey) {
    res.status(400).json({
      ok: false,
      error: { code: "NO_API_KEY", message: "NO_API_KEY" },
    });
    return;
  }

  const contextStr = typeof context === "string" ? context : "";
  const sysPrompt = systemPrompt(trackId);
  const fullSystem = contextStr ? `${sysPrompt}\nContexto actual: ${contextStr}` : sysPrompt;

  const groqBody = {
    model: MODEL,
    messages: [
      { role: "system", content: fullSystem },
      { role: "user", content: prompt },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  };

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(groqBody),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      res.status(502).json({
        ok: false,
        error: { code: "GROQ_ERROR", message: `HTTP_ERROR:${groqRes.status} ${errText}` },
      });
      return;
    }

    const groqData = await groqRes.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const response = groqData.choices[0]?.message?.content ?? "";

    res.json({ ok: true, data: { response } });
  } catch (err) {
    res.status(502).json({
      ok: false,
      error: { code: "GROQ_ERROR", message: `HTTP_ERROR:${String(err)}` },
    });
  }
});

export default router;
