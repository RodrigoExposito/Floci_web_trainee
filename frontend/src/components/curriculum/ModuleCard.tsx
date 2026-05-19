import { useNavigate } from "react-router-dom";
import { CheckCircle, Circle } from "lucide-react";
import type { Module, ProgressStatus } from "@/lib/types";
import { useProgressStore } from "@/stores/progress-store";
import { getModuleMeta } from "@/lib/module-registry";

interface Props {
  module: Module;
  trackId: string;
}

function StatusIcon({ status }: { status: ProgressStatus }) {
  if (status === "completed")
    return <CheckCircle className="size-3.5" style={{ color: "var(--accent)" }} />;
  return <Circle className="size-3.5" style={{ color: "var(--accent)", opacity: 0.6 }} />;
}

export function ModuleCard({ module, trackId }: Props) {
  const navigate = useNavigate();
  const getModuleStatus = useProgressStore((s) => s.getModuleStatus);
  const completedCount = useProgressStore((s) => s.completedCount);

  const status: ProgressStatus = getModuleStatus(module.id);
  const meta = getModuleMeta(trackId, module.id);
  const total = meta ? meta.lessons.length + meta.challenges.length : 0;
  const done = completedCount(module.id);
  const order = String(module.order).padStart(2, "0");

  return (
    <button
      onClick={() => navigate(`/${trackId}/module/${module.id}`)}
      className="group flex flex-col gap-3 rounded-[10px] p-4 text-left transition-all"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-focus)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
            {order}
          </span>
          <StatusIcon status={status} />
        </div>
        {module.serviceTag && (
          <span
            className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono leading-none"
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

      <div className="min-w-0">
        <p className="font-medium text-sm leading-tight" style={{ color: "var(--text-primary)" }}>
          {module.title}
        </p>
        <p
          className="mt-1 text-xs line-clamp-2 leading-relaxed"
          style={{ color: "var(--text-tertiary)" }}
        >
          {module.description}
        </p>
      </div>

      {total > 0 && (
        <div className="space-y-1">
          <div
            className="h-1 w-full overflow-hidden rounded-full"
            style={{ background: "var(--bg-overlay)" }}
          >
            <div
              className="h-1 rounded-full transition-all"
              style={{ width: `${(done / total) * 100}%`, background: "var(--accent)" }}
            />
          </div>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {done}/{total} completados
          </p>
        </div>
      )}
    </button>
  );
}
