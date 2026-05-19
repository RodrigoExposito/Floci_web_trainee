import type { ModuleMeta } from "@/lib/types";

const metaGlob = import.meta.glob<ModuleMeta>(
  "../content/tracks/*/modules/*/meta.json",
  { eager: true, import: "default" }
);

// Registry key: "trackId:moduleId"
const registry = new Map<string, ModuleMeta>();

for (const [path, meta] of Object.entries(metaGlob)) {
  const m = /tracks\/([^/]+)\/modules\/([^/]+)\/meta\.json$/.exec(path);
  if (m && meta?.id) {
    registry.set(`${m[1]}:${m[2]}`, meta);
  }
}

export function getModuleMeta(trackId: string, moduleId: string): ModuleMeta | undefined {
  return registry.get(`${trackId}:${moduleId}`);
}

export function getAllMetas(trackId: string): ModuleMeta[] {
  const prefix = `${trackId}:`;
  return Array.from(registry.entries())
    .filter(([k]) => k.startsWith(prefix))
    .map(([, v]) => v);
}

export function totalItems(trackId: string, moduleId: string): number {
  const meta = getModuleMeta(trackId, moduleId);
  if (!meta) return 0;
  return meta.lessons.length + meta.challenges.length;
}
