import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Target } from "lucide-react";
import type { Module } from "@/lib/types";
import { useProgressStore } from "@/stores/progress-store";
import { getModuleMeta } from "@/lib/module-registry";
import { getLessonTitle, getChallengeTitle } from "@/lib/content-registry";

interface Props {
  module: Module;
  trackId: string;
}

export function ActiveModuleCard({ module, trackId }: Props) {
  const navigate = useNavigate();
  const completedCount = useProgressStore((s) => s.completedCount);
  const getLessonStatus = useProgressStore((s) => s.getLessonStatus);

  const meta = getModuleMeta(trackId, module.id);
  const done = completedCount(module.id);
  const total = meta ? meta.lessons.length + meta.challenges.length : 0;
  const lessonsTotal = meta?.lessons.length ?? 0;
  const challengesTotal = meta?.challenges.length ?? 0;
  const lessonsDone = meta
    ? meta.lessons.filter((id) => getLessonStatus(module.id, id) === "completed").length
    : 0;
  const challengesDone = meta
    ? meta.challenges.filter((id) => getLessonStatus(module.id, id) === "completed").length
    : 0;

  const nextItem = (() => {
    if (!meta) return null;
    for (const id of meta.lessons) {
      if (getLessonStatus(module.id, id) !== "completed") return { type: "lesson" as const, id };
    }
    for (const id of meta.challenges) {
      if (getLessonStatus(module.id, id) !== "completed") return { type: "challenge" as const, id };
    }
    return null;
  })();

  function handleContinue() {
    if (!nextItem) {
      navigate(`/${trackId}/module/${module.id}`);
      return;
    }
    if (nextItem.type === "lesson") {
      navigate(`/${trackId}/module/${module.id}/lesson/${nextItem.id}`);
    } else {
      navigate(`/${trackId}/module/${module.id}/challenge/${nextItem.id}`);
    }
  }

  const progress = total > 0 ? (done / total) * 100 : 0;

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Módulo activo
            </span>
            {module.serviceTag && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-mono"
                style={{
                  background: "var(--bg-overlay)",
                  color: "var(--text-tertiary)",
                  border: "1px solid var(--border)",
                }}
              >
                {module.serviceTag}
              </span>
            )}
          </div>

          <h2 className="text-lg font-semibold leading-tight truncate" style={{ color: "var(--text-primary)" }}>
            {module.title}
          </h2>
          <p className="mt-1 text-sm line-clamp-2" style={{ color: "var(--text-secondary)" }}>
            {module.description}
          </p>

          <div className="mt-3 flex gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-3" />
              {lessonsDone}/{lessonsTotal} lecciones
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="size-3" />
              {challengesDone}/{challengesTotal} challenges
            </span>
          </div>

          <div className="mt-3 space-y-1">
            <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--bg-overlay)" }}>
              <div
                className="h-1 rounded-full transition-all"
                style={{ width: `${progress}%`, background: "var(--accent)" }}
              />
            </div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {done}/{total} completados
            </p>
          </div>
        </div>

        <button onClick={handleContinue} className="btn btn-primary shrink-0">
          Continuar
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      {nextItem && (
        <p className="mt-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
          Siguiente:{" "}
          <span style={{ color: "var(--text-secondary)" }}>
            {nextItem.type === "lesson"
              ? getLessonTitle(trackId, module.id, nextItem.id)
              : getChallengeTitle(trackId, module.id, nextItem.id)}
          </span>
        </p>
      )}
    </div>
  );
}
