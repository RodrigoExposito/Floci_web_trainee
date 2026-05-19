import { useNavigate, useParams } from "react-router-dom";
import { Lightbulb } from "lucide-react";
import { loadExamples } from "@/lib/curriculum-loader";
import type { ExampleMeta } from "@/lib/types";

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

function ExampleCard({ meta, trackId }: { meta: ExampleMeta; trackId: string }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/${trackId}/examples/${meta.id}`)}
      className="text-left w-full transition-all"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "16px 18px",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-focus)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span
          className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider"
          style={{
            background: "var(--bg-overlay)",
            color: "var(--text-tertiary)",
            border: "1px solid var(--border)",
          }}
        >
          {meta.category}
        </span>
        <DifficultyDots level={meta.difficulty} />
      </div>
      <p className="text-sm font-semibold mb-1 leading-snug" style={{ color: "var(--text-primary)" }}>
        {meta.title}
      </p>
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {meta.description}
      </p>
    </button>
  );
}

export default function ExamplesView() {
  const { trackId = "aws" } = useParams<{ trackId: string }>();
  const examples = loadExamples(trackId);
  const trackLabel = trackId === "agentes" ? "Agente Trainee" : "AWS Trainee";

  return (
    <div className="mx-auto max-w-3xl fade-in pb-16">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="size-5" style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Ejemplos
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Casos prácticos de <strong style={{ color: "var(--text-primary)" }}>{trackLabel}</strong>{" "}
          — código comentado, flujos completos y resultado esperado. Solo lectura, sin validación.
        </p>
      </div>

      {examples.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl py-20 gap-4"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        >
          <p className="text-4xl">🚧</p>
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Ejemplos en camino
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Este track no tiene ejemplos todavía.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {examples.map((ex) => (
            <ExampleCard key={ex.id} meta={ex} trackId={trackId} />
          ))}
        </div>
      )}
    </div>
  );
}
