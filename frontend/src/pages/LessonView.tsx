import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { loadLesson, loadModule } from "@/lib/curriculum-loader";
import { getModuleMeta } from "@/lib/module-registry";
import { useProgressStore } from "@/stores/progress-store";
import { useAiStore } from "@/stores/ai-store";
import { MarkdownContent } from "@/components/curriculum/MarkdownContent";
import type { Lesson } from "@/lib/types";

export default function LessonView() {
  const { trackId, moduleId, lessonId } = useParams<{
    trackId: string;
    moduleId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();
  const { markCompleted, getLessonStatus } = useProgressStore();
  const { setContext } = useAiStore();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trackId || !moduleId || !lessonId) return;
    setLoading(true);
    loadLesson(trackId, moduleId, lessonId).then((l) => {
      setLesson(l);
      setLoading(false);
      if (l) {
        const mod = loadModule(trackId, moduleId);
        const preview = l.content.slice(0, 500).replace(/[#*`]/g, "").trim();
        setContext(
          "lesson",
          `Módulo: ${mod?.title ?? moduleId}. Lección: ${l.title}. Contenido: ${preview}`
        );
      }
    });
  }, [trackId, moduleId, lessonId]);

  if (!trackId || !moduleId || !lessonId) return null;

  const meta = getModuleMeta(trackId, moduleId);
  const status = getLessonStatus(moduleId, lessonId);
  const isCompleted = status === "completed";

  const allItems = meta
    ? [
        ...meta.lessons.map((id) => ({ type: "lesson" as const, id })),
        ...meta.challenges.map((id) => ({ type: "challenge" as const, id })),
      ]
    : [];
  const currentIdx = allItems.findIndex((i) => i.id === lessonId);
  const prevItem = currentIdx > 0 ? allItems[currentIdx - 1] : null;
  const nextItem = currentIdx < allItems.length - 1 ? allItems[currentIdx + 1] : null;

  const lessonIdx = meta ? meta.lessons.indexOf(lessonId) : -1;
  const lessonTotal = meta?.lessons.length ?? 0;

  function navigateTo(item: (typeof allItems)[number]) {
    if (item.type === "lesson")
      navigate(`/${trackId}/module/${moduleId}/lesson/${item.id}`);
    else
      navigate(`/${trackId}/module/${moduleId}/challenge/${item.id}`);
  }

  async function handleMarkCompleted() {
    if (!moduleId || !lessonId) return;
    await markCompleted(moduleId, lessonId);
  }

  // Keyboard navigation: ← prev, → next
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowLeft" && prevItem) navigateTo(prevItem);
      if (e.key === "ArrowRight" && nextItem) navigateTo(nextItem);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevItem, nextItem]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Cargando lección...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Lección no encontrada.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[680px] space-y-8 pb-16 fade-in">
      {lessonIdx >= 0 && (
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-tertiary)" }}
          >
            Lección {String(lessonIdx + 1).padStart(2, "0")} de{" "}
            {String(lessonTotal).padStart(2, "0")}
          </span>
        </div>
      )}

      <MarkdownContent content={lesson.content} />

      <div className="pt-6 flex flex-col items-center gap-3" style={{ borderTop: "1px solid var(--border)" }}>
        {isCompleted ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--accent)" }}>
            <CheckCircle className="size-4" />
            <span className="font-medium">Lección completada</span>
          </div>
        ) : (
          <button onClick={() => void handleMarkCompleted()} className="btn btn-primary">
            Marcar como leída
          </button>
        )}
      </div>

      <div className="flex justify-between">
        {prevItem ? (
          <button
            onClick={() => navigateTo(prevItem)}
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            <ChevronLeft className="size-4" />
            Anterior
          </button>
        ) : (
          <div />
        )}
        {nextItem && (
          <button
            onClick={() => navigateTo(nextItem)}
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            {nextItem.type === "challenge" ? "Ir al challenge" : "Siguiente"}
            <ChevronRight className="size-4" />
          </button>
        )}
      </div>

      <p className="text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
        ← → para navegar
      </p>
    </div>
  );
}
