import type { Curriculum, Module, Lesson, Challenge, Example, ExampleMeta } from "@/lib/types";

// ── Static loaders (eager, synchronous) ──────────────────────────────────────

const curriculumGlob = import.meta.glob<Curriculum>(
  "../content/tracks/*/curriculum.json",
  { eager: true, import: "default" }
);

export function loadCurriculum(trackId: string): Curriculum {
  const key = `../content/tracks/${trackId}/curriculum.json`;
  const data = curriculumGlob[key];
  if (!data) return { modules: [] };
  return data;
}

export function loadModule(trackId: string, moduleId: string): Module | undefined {
  return loadCurriculum(trackId).modules.find((m) => m.id === moduleId);
}

// ── Dynamic loaders via import.meta.glob ─────────────────────────────────────

const lessonGlob = import.meta.glob<string>(
  "../content/tracks/*/modules/*/lessons/*.md",
  { query: "?raw", import: "default" }
);

const challengeGlob = import.meta.glob<Challenge>(
  "../content/tracks/*/modules/*/challenges/*.json",
  { import: "default" }
);

function extractTitle(markdown: string): string {
  const match = /^#\s+(.+)$/m.exec(markdown);
  return match ? match[1].trim() : "Lección";
}

export async function loadLesson(
  trackId: string,
  moduleId: string,
  lessonId: string
): Promise<Lesson | null> {
  const key = `../content/tracks/${trackId}/modules/${moduleId}/lessons/${lessonId}.md`;
  const loader = lessonGlob[key];
  if (!loader) return null;

  try {
    const content = await loader();
    return { id: lessonId, moduleId, title: extractTitle(content), content };
  } catch {
    return null;
  }
}

export async function loadChallenge(
  trackId: string,
  moduleId: string,
  challengeId: string
): Promise<Challenge | null> {
  const key = `../content/tracks/${trackId}/modules/${moduleId}/challenges/${challengeId}.json`;
  const loader = challengeGlob[key];
  if (!loader) return null;

  try {
    return await loader();
  } catch {
    return null;
  }
}

// ── Examples ─────────────────────────────────────────────────────────────────

const examplesIndexGlob = import.meta.glob<ExampleMeta[]>(
  "../content/tracks/*/examples.json",
  { eager: true, import: "default" }
);

const exampleGlob = import.meta.glob<Example>(
  "../content/tracks/*/examples/*.json",
  { import: "default" }
);

export function loadExamples(trackId: string): ExampleMeta[] {
  const key = `../content/tracks/${trackId}/examples.json`;
  const data = examplesIndexGlob[key];
  return data ?? [];
}

export async function loadExample(
  trackId: string,
  exampleId: string
): Promise<Example | null> {
  const key = `../content/tracks/${trackId}/examples/${exampleId}.json`;
  const loader = exampleGlob[key];
  if (!loader) return null;

  try {
    return await loader();
  } catch {
    return null;
  }
}
