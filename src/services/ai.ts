import { createHash } from "crypto";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const TIMEOUT_MS = 30_000;

export function buildSystemPrompt(trackId: string): string {
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

export class AiError extends Error {
  constructor(
    public readonly code: "NO_API_KEY" | "RATE_LIMIT" | "GROQ_ERROR" | "TIMEOUT",
    message: string
  ) {
    super(message);
    this.name = "AiError";
  }
}

export async function callGroq(
  prompt: string,
  context: string,
  trackId: string
): Promise<string> {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) throw new AiError("NO_API_KEY", "GROQ_API_KEY not configured");

  const sysPrompt = buildSystemPrompt(trackId);
  const fullSystem = context ? `${sysPrompt}\nContexto actual: ${context}` : sysPrompt;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: fullSystem },
          { role: "user", content: prompt },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (groqRes.status === 429) {
      throw new AiError("RATE_LIMIT", "Rate limit exceeded — intentá de nuevo en unos segundos.");
    }
    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new AiError("GROQ_ERROR", `HTTP_ERROR:${groqRes.status} ${errText}`);
    }

    const data = (await groqRes.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message?.content ?? "";
  } catch (err) {
    if (err instanceof AiError) throw err;
    const name = (err as Error).name;
    if (name === "AbortError") throw new AiError("TIMEOUT", "La solicitud a Groq tardó demasiado.");
    throw new AiError("GROQ_ERROR", `HTTP_ERROR:${String(err)}`);
  } finally {
    clearTimeout(timer);
  }
}

// Auth token derivation — used by both login route and auth middleware
export function deriveToken(password: string): string {
  return createHash("sha256").update(`floci-access:${password}`).digest("hex");
}
