import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lightbulb } from "lucide-react";
import { loadCurriculum, loadExamples } from "@/lib/curriculum-loader";
import { useProgressStore } from "@/stores/progress-store";
import { useTrackStore, type TrackId } from "@/stores/track-store";
import { ModuleCard } from "@/components/curriculum/ModuleCard";
import { ActiveModuleCard } from "@/components/curriculum/ActiveModuleCard";
import { getProgress } from "@/lib/api";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días.";
  if (hour < 18) return "Buenas tardes.";
  return "Buenas noches.";
}

export default function Dashboard() {
  const { trackId: rawTrackId } = useParams<{ trackId: string }>();
  const trackId = (rawTrackId ?? "aws") as TrackId;
  const navigate = useNavigate();

  const { hydrateFromDb, getModuleStatus } = useProgressStore();
  const { setActiveTrack } = useTrackStore();

  const { modules } = loadCurriculum(trackId);
  const examples = loadExamples(trackId);

  useEffect(() => {
    void setActiveTrack(trackId);

    async function loadProgressData() {
      try {
        const records = await getProgress(trackId);
        hydrateFromDb(records, trackId);
      } catch (err) {
        console.error("Failed to load progress:", err);
      }
    }
    void loadProgressData();
  }, [trackId]);

  const activeModule =
    modules.find((m) => getModuleStatus(m.id) === "active") ?? modules[0];

  if (modules.length === 0) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {greeting()}
          </h1>
        </div>
        <div
          className="flex flex-col items-center justify-center rounded-xl py-20 gap-4"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        >
          <p className="text-4xl">🚧</p>
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Contenido en camino
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Este track está en desarrollo. Volvé pronto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {greeting()}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Continuá donde lo dejaste.
        </p>
      </div>

      {activeModule && (
        <ActiveModuleCard module={activeModule} trackId={trackId} />
      )}

      <div>
        <h2
          className="mb-4 text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-tertiary)" }}
        >
          Todos los módulos
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <ModuleCard key={mod.id} module={mod} trackId={trackId} />
          ))}
        </div>
      </div>

      {examples.length > 0 && (
        <button
          onClick={() => navigate(`/${trackId}/examples`)}
          className="w-full text-left transition-all"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-focus)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "var(--accent-dim)",
              border: "1px solid var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Lightbulb className="size-4" style={{ color: "var(--accent)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {examples.length} ejemplo{examples.length !== 1 ? "s" : ""} práctico{examples.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Casos de uso completos con código y resultado esperado
            </p>
          </div>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Ver todos →</span>
        </button>
      )}

      {trackId === "agentes" && (
        <p className="text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
          Contenido basado en{" "}
          <em>Agents Towards Production</em> de Nir Diamant
        </p>
      )}
    </div>
  );
}
