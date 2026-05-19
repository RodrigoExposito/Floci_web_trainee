import { create } from "zustand";
import { updateProgress } from "@/lib/api";
import type { ProgressStatus, ProgressRecord } from "@/lib/types";
import { getModuleMeta } from "@/lib/module-registry";
import { loadCurriculum } from "@/lib/curriculum-loader";

type LessonMap = Record<string, ProgressStatus>;
type ProgressMap = Record<string, LessonMap>;

interface ProgressStore {
  lessonProgress: ProgressMap;
  currentTrackId: string;
  hydrated: boolean;
  hydrateFromDb: (records: ProgressRecord[], trackId: string) => void;
  getLessonStatus: (moduleId: string, lessonId: string) => ProgressStatus;
  getModuleStatus: (moduleId: string) => ProgressStatus;
  markCompleted: (moduleId: string, lessonId: string) => Promise<void>;
  completedCount: (moduleId: string) => number;
}

export function computeModuleStatus(
  trackId: string,
  moduleId: string,
  progress: ProgressMap
): ProgressStatus {
  const meta = getModuleMeta(trackId, moduleId);
  if (!meta) return "locked";

  for (const prereqId of meta.prereqs) {
    if (computeModuleStatus(trackId, prereqId, progress) !== "completed") {
      return "locked";
    }
  }

  const allItems = [...meta.lessons, ...meta.challenges];
  if (allItems.length === 0) return "active";

  const moduleProgress = progress[moduleId] ?? {};
  const allDone = allItems.every((id) => moduleProgress[id] === "completed");
  return allDone ? "completed" : "active";
}

function buildInitialProgress(trackId: string): ProgressMap {
  const { modules } = loadCurriculum(trackId);
  const map: ProgressMap = {};
  const firstModule = modules[0];
  if (firstModule) {
    const meta = getModuleMeta(trackId, firstModule.id);
    if (meta) {
      map[firstModule.id] = {};
      for (const id of [...meta.lessons, ...meta.challenges]) {
        map[firstModule.id][id] = "active";
      }
    }
  }
  return map;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  lessonProgress: buildInitialProgress("aws"),
  currentTrackId: "aws",
  hydrated: false,

  hydrateFromDb(records, trackId) {
    const map: ProgressMap = {};
    for (const r of records) {
      if (!map[r.module_id]) map[r.module_id] = {};
      map[r.module_id][r.lesson_id] = r.status as ProgressStatus;
    }
    if (Object.keys(map).length === 0) {
      const initial = buildInitialProgress(trackId);
      Object.assign(map, initial);
    }
    set({ lessonProgress: map, currentTrackId: trackId, hydrated: true });
  },

  getLessonStatus(moduleId, lessonId) {
    return get().lessonProgress[moduleId]?.[lessonId] ?? "active";
  },

  getModuleStatus(moduleId) {
    return computeModuleStatus(
      get().currentTrackId,
      moduleId,
      get().lessonProgress
    );
  },

  completedCount(moduleId) {
    const meta = getModuleMeta(get().currentTrackId, moduleId);
    if (!meta) return 0;
    const allItems = [...meta.lessons, ...meta.challenges];
    const moduleProgress = get().lessonProgress[moduleId] ?? {};
    return allItems.filter((id) => moduleProgress[id] === "completed").length;
  },

  async markCompleted(moduleId, lessonId) {
    // Optimistic update
    set((state) => ({
      lessonProgress: {
        ...state.lessonProgress,
        [moduleId]: {
          ...(state.lessonProgress[moduleId] ?? {}),
          [lessonId]: "completed",
        },
      },
    }));

    try {
      await updateProgress(get().currentTrackId, moduleId, lessonId, "completed");
    } catch (err) {
      console.error("Failed to persist progress:", err);
    }
  },
}));
