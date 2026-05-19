import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, Target, CheckCircle, Circle, Lock } from "lucide-react";
import { loadModule } from "@/lib/curriculum-loader";
import { getModuleMeta } from "@/lib/module-registry";
import { getLessonTitle, getChallengeTitle } from "@/lib/content-registry";
import { useProgressStore } from "@/stores/progress-store";
import type { ProgressStatus } from "@/lib/types";

function StatusIcon({ status }: { status: ProgressStatus }) {
  if (status === "completed")
    return <CheckCircle className="size-3.5 shrink-0" style={{ color: "var(--accent)" }} />;
  if (status === "active")
    return <Circle className="size-3.5 shrink-0" style={{ color: "var(--accent)", opacity: 0.6 }} />;
  return <Lock className="size-3.5 shrink-0" style={{ color: "var(--text-tertiary)" }} />;
}

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full"
          style={{ background: i <= level ? "var(--accent)" : "var(--border-focus)" }}
        />
      ))}
    </div>
  );
}

export default function ModuleView() {
  const { trackId, moduleId } = useParams<{ trackId: string; moduleId: string }>();
  const navigate = useNavigate();
  const getLessonStatus = useProgressStore((s) => s.getLessonStatus);

  if (!trackId || !moduleId) return null;

  const mod = loadModule(trackId, moduleId);
  const meta = getModuleMeta(trackId, moduleId);

  if (!mod || !meta) {
    navigate(`/${trackId}`, { replace: true });
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 fade-in">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {mod.serviceTag && (
            <span
              className="rounded px-2 py-0.5 text-xs font-mono"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {mod.serviceTag}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {mod.title}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {mod.description}
        </p>
      </div>

      {meta.lessons.length > 0 && (
        <section>
          <h2
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-tertiary)" }}
          >
            Lecciones
          </h2>
          <div className="space-y-1.5">
            {meta.lessons.map((lessonId, idx) => {
              const status = getLessonStatus(moduleId, lessonId);
              return (
                <button
                  key={lessonId}
                  onClick={() => navigate(`/${trackId}/module/${moduleId}/lesson/${lessonId}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors"
                  style={{
                    background: status === "completed" ? "var(--accent-dim)" : "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-focus)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <BookOpen className="size-3.5 shrink-0" style={{ color: "var(--text-tertiary)" }} />
                  <StatusIcon status={status} />
                  <span className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>
                    {getLessonTitle(trackId, moduleId, lessonId) || lessonId}
                  </span>
                  <span className="text-xs font-mono shrink-0" style={{ color: "var(--text-tertiary)" }}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {meta.challenges.length > 0 && (
        <section>
          <h2
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-tertiary)" }}
          >
            Challenges
          </h2>
          <div className="space-y-1.5">
            {meta.challenges.map((challengeId, idx) => {
              const status = getLessonStatus(moduleId, challengeId);
              return (
                <button
                  key={challengeId}
                  onClick={() => navigate(`/${trackId}/module/${moduleId}/challenge/${challengeId}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors"
                  style={{
                    background: status === "completed" ? "var(--accent-dim)" : "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-focus)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <Target className="size-3.5 shrink-0" style={{ color: "var(--text-tertiary)" }} />
                  <StatusIcon status={status} />
                  <span className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>
                    {getChallengeTitle(trackId, moduleId, challengeId) || challengeId}
                  </span>
                  <DifficultyDots level={idx + 1} />
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
