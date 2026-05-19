import { useState } from "react";
import { LogOut, Bot, Cpu, RotateCcw, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { useProgressStore } from "@/stores/progress-store";
import { useTrackStore } from "@/stores/track-store";
import { loadCurriculum } from "@/lib/curriculum-loader";

type ConfirmState = "idle" | "confirm-module" | "confirm-all";

export default function Settings() {
  const { logout } = useAuthStore();
  const { theme, toggle: toggleTheme } = useThemeStore();
  const { clearModuleProgress, clearAllProgress, currentTrackId } = useProgressStore();
  const { activeTrackId } = useTrackStore();

  const trackId = currentTrackId || activeTrackId;
  const { modules } = loadCurriculum(trackId);

  const [selectedModule, setSelectedModule] = useState(modules[0]?.id ?? "");
  const [confirmState, setConfirmState] = useState<ConfirmState>("idle");
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState<string | null>(null);

  async function handleResetModule() {
    if (!selectedModule || resetting) return;
    if (confirmState !== "confirm-module") {
      setConfirmState("confirm-module");
      return;
    }
    setResetting(true);
    setConfirmState("idle");
    try {
      await clearModuleProgress(selectedModule);
      const mod = modules.find((m) => m.id === selectedModule);
      setResetDone(`Progreso de "${mod?.title ?? selectedModule}" borrado.`);
      setTimeout(() => setResetDone(null), 4000);
    } finally {
      setResetting(false);
    }
  }

  async function handleResetAll() {
    if (resetting) return;
    if (confirmState !== "confirm-all") {
      setConfirmState("confirm-all");
      return;
    }
    setResetting(true);
    setConfirmState("idle");
    try {
      await clearAllProgress();
      setResetDone("Todo el progreso fue borrado.");
      setTimeout(() => setResetDone(null), 4000);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg pb-16 fade-in">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        Configuración
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
        Ajustes de la aplicación
      </p>

      {/* Apariencia */}
      <section
        className="mb-4"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="size-4" style={{ color: "var(--accent)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Apariencia
          </h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>Tema</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {theme === "dark" ? "Modo oscuro activo" : "Modo claro activo"}
            </p>
          </div>
          <button onClick={toggleTheme} className="btn btn-secondary btn-sm">
            Cambiar a {theme === "dark" ? "claro" : "oscuro"}
          </button>
        </div>
      </section>

      {/* IA */}
      <section
        className="mb-4"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Bot className="size-4" style={{ color: "var(--accent)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Asistente IA
          </h2>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          El asistente usa{" "}
          <strong style={{ color: "var(--text-primary)" }}>Groq / llama-3.3-70b-versatile</strong>.
          La API key está configurada en el servidor.
        </p>
      </section>

      {/* Reiniciar progreso */}
      <section
        className="mb-4"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw className="size-4" style={{ color: "var(--accent)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Reiniciar progreso
          </h2>
        </div>

        {/* By module */}
        <div className="mb-5">
          <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
            Borra el progreso de un módulo específico del track actual
            <span
              className="ml-1 font-mono"
              style={{
                background: "var(--bg-overlay)",
                borderRadius: 4,
                padding: "1px 5px",
                color: "var(--text-tertiary)",
              }}
            >
              {trackId}
            </span>
          </p>
          <div className="flex gap-2">
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setConfirmState("idle");
              }}
              style={{
                flex: 1,
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 13,
                color: "var(--text-primary)",
                outline: "none",
              }}
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id} style={{ background: "var(--bg-elevated)" }}>
                  {m.title}
                </option>
              ))}
            </select>
            <button
              onClick={() => void handleResetModule()}
              disabled={resetting || !selectedModule}
              className="btn btn-secondary btn-sm shrink-0"
              style={
                confirmState === "confirm-module"
                  ? { borderColor: "var(--danger)", color: "var(--danger)" }
                  : {}
              }
            >
              {confirmState === "confirm-module" ? "¿Confirmar?" : "Reiniciar módulo"}
            </button>
          </div>
          {confirmState === "confirm-module" && (
            <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: "var(--danger)" }}>
              <AlertTriangle className="size-3" />
              Esto borrará el progreso de ese módulo. No se puede deshacer.
              <button
                onClick={() => setConfirmState("idle")}
                className="ml-auto underline"
                style={{ color: "var(--text-tertiary)" }}
              >
                Cancelar
              </button>
            </p>
          )}
        </div>

        {/* All progress */}
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
            Borra todo el progreso del track actual
          </p>
          <button
            onClick={() => void handleResetAll()}
            disabled={resetting}
            className="btn btn-secondary btn-sm"
            style={
              confirmState === "confirm-all"
                ? { borderColor: "var(--danger)", color: "var(--danger)" }
                : {}
            }
          >
            {confirmState === "confirm-all" ? "¿Confirmar reset total?" : "Reiniciar todo"}
          </button>
          {confirmState === "confirm-all" && (
            <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: "var(--danger)" }}>
              <AlertTriangle className="size-3" />
              Borrará TODO el progreso de este track. No se puede deshacer.
              <button
                onClick={() => setConfirmState("idle")}
                className="ml-auto underline"
                style={{ color: "var(--text-tertiary)" }}
              >
                Cancelar
              </button>
            </p>
          )}
        </div>

        {resetDone && (
          <p className="mt-3 text-xs" style={{ color: "var(--accent)" }}>
            ✓ {resetDone}
          </p>
        )}
      </section>

      {/* Sesión */}
      <section
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <LogOut className="size-4" style={{ color: "var(--danger)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Sesión
          </h2>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
          Tu sesión se cierra automáticamente al cerrar el navegador.
        </p>
        <button
          onClick={logout}
          className="btn btn-ghost btn-sm flex items-center gap-1.5"
          style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
        >
          <LogOut className="size-3.5" />
          Cerrar sesión
        </button>
      </section>
    </div>
  );
}
