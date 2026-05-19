import type { ProgressRecord } from "@/lib/types";
import { getToken } from "@/stores/auth-store";

// In dev, Vite proxies /api to localhost:3000.
// In prod, the Express server serves both the SPA and /api from the same origin.
const BASE = "";

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // Token expired or invalid — clear session and reload to login screen
    sessionStorage.removeItem("floci-access-token");
    window.location.href = "/";
    throw new Error("Session expired");
  }

  const json = await res.json() as { ok: boolean; data?: T; error?: { code: string; message: string } };
  if (!json.ok) {
    throw new Error(json.error?.message ?? "API error");
  }
  return json.data as T;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  try {
    const data = await call<{ key: string; value: string }>("GET", `/api/settings/${key}`);
    return data.value;
  } catch {
    return null;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await call<void>("PUT", `/api/settings/${key}`, { value });
}

// ── Progress ──────────────────────────────────────────────────────────────────

export async function getProgress(trackId: string): Promise<ProgressRecord[]> {
  return call<ProgressRecord[]>("GET", `/api/progress?track=${encodeURIComponent(trackId)}`);
}

export async function updateProgress(
  trackId: string,
  moduleId: string,
  lessonId: string,
  status: string
): Promise<void> {
  await call<void>("POST", "/api/progress", {
    track_id: trackId,
    module_id: moduleId,
    lesson_id: lessonId,
    status,
  });
}

// ── Attempts ──────────────────────────────────────────────────────────────────

export async function recordAttempt(
  trackId: string,
  challengeId: string,
  passed: boolean,
  feedback: string
): Promise<void> {
  await call<void>("POST", "/api/attempts", {
    track_id: trackId,
    challenge_id: challengeId,
    passed,
    feedback,
  });
}

// ── Weak areas ────────────────────────────────────────────────────────────────

export async function updateWeakArea(
  trackId: string,
  moduleId: string,
  topic: string,
  missCount: number
): Promise<void> {
  await call<void>("POST", "/api/weak-areas", {
    track_id: trackId,
    module_id: moduleId,
    topic,
    miss_count: missCount,
  });
}

// ── Floci ─────────────────────────────────────────────────────────────────────

export async function checkFlociStatus(): Promise<boolean> {
  try {
    const data = await call<{ running: boolean }>("GET", "/api/floci/status");
    return data.running;
  } catch {
    return false;
  }
}

// ── AWS Validation ────────────────────────────────────────────────────────────

export interface SingleValidationResult {
  passed: boolean;
  actual_output: string;
}

export async function runSingleValidation(
  cmd: string,
  expect: string
): Promise<SingleValidationResult> {
  return call<SingleValidationResult>("POST", "/api/validate/aws/single", { cmd, expect });
}

// ── Python Validation ─────────────────────────────────────────────────────────

export interface PythonValidationItem {
  expect: string;
  criterion: string;
}

export interface PythonValidationResult {
  criterion_index: number;
  passed: boolean;
  actual_output: string;
  criterion: string;
}

export interface PythonRunResponse {
  results: PythonValidationResult[];
  allPassed: boolean;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export async function runPythonValidation(
  trackId: string,
  challengeId: string,
  code: string,
  validations: PythonValidationItem[]
): Promise<PythonRunResponse> {
  const raw = await call<{
    results: Array<{ criterion: string; passed: boolean; actual_output: string }>;
    allPassed: boolean;
    stdout: string;
    stderr: string;
    timedOut: boolean;
  }>("POST", "/api/validate/python", {
    track_id: trackId,
    challenge_id: challengeId,
    code,
    validations,
  });

  return {
    ...raw,
    results: raw.results.map((r, i) => ({ ...r, criterion_index: i })),
  };
}

// ── AI ────────────────────────────────────────────────────────────────────────

export async function callAi(
  prompt: string,
  context: string,
  trackId: string
): Promise<string> {
  const data = await call<{ response: string }>("POST", "/api/ai/chat", {
    prompt,
    context,
    track_id: trackId,
  });
  return data.response;
}
