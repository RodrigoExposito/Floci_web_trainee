import { create } from "zustand";
import { updateProgress, resetModuleProgress, resetAllProgress } from "@/lib/api";
import type { ProgressStatus, ProgressRecord } from "@/lib/types";
import { getModuleMeta } from "@/lib/module-registry";

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
  clearModuleProgress: (moduleId: string) => Promise<void>;
  clearAllProgress: () => Promise<void>;
}

// Modules are never locked between each other — any module is accessible from the start.
// Status is "completed" only when all items inside are done; otherwise "active".
export function computeModuleStatus(
  trackId: string,
  moduleId: string,
  progress: ProgressMap
): ProgressStatus {
  const meta = getModuleMeta(trackId, moduleId);
  if (!meta) return "active";

  const allItems = [...meta.lessons, ...meta.challenges];
  if (allItems.length === 0) return "active";

  const moduleProgress = progress[moduleId] ?? {};
  const allDone = allItems.every((id) => moduleProgress[id] === "completed");
  return allDone ? "completed" : "active";
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  lessonProgress: {},
  currentTrackId: "aws",
  hydrated: false,

  hydrateFromDb(records, trackId) {
    const map: ProgressMap = {};
    for (const r of records) {
      if (!map[r.module_id]) map[r.module_id] = {};
      map[r.module_id][r.lesson_id] = r.status as ProgressStatus;
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

  async clearModuleProgress(moduleId) {
    const trackId = get().currentTrackId;
    await resetModuleProgress(trackId, moduleId);
    set((state) => {
      const { [moduleId]: _removed, ...rest } = state.lessonProgress;
      return { lessonProgress: rest };
    });
  },

  async clearAllProgress() {
    const trackId = get().currentTrackId;
    await resetAllProgress(trackId);
    set({ lessonProgress: {} });
  },
}));
