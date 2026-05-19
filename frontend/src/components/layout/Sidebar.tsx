import { useNavigate, NavLink } from "react-router-dom";
import { Settings, Cloud, Bot, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadCurriculum } from "@/lib/curriculum-loader";
import { useProgressStore } from "@/stores/progress-store";
import { useTrackStore, type TrackId } from "@/stores/track-store";
import type { ProgressStatus } from "@/lib/types";

const TRACKS = [
  { id: "aws" as TrackId, label: "AWS Trainee", Icon: Cloud },
  { id: "agentes" as TrackId, label: "Agente Trainee", Icon: Bot },
];

function StatusDot({ status }: { status: ProgressStatus }) {
  if (status === "completed") {
    return (
      <span
        className="size-1.5 rounded-full shrink-0"
        style={{ background: "var(--accent)" }}
      />
    );
  }
  if (status === "active") {
    return (
      <span
        className="size-1.5 rounded-full shrink-0"
        style={{ background: "transparent", border: "1.5px solid var(--accent)" }}
      />
    );
  }
  return (
    <span
      className="size-1.5 rounded-full shrink-0"
      style={{ background: "var(--border-focus)" }}
    />
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const { activeTrackId, setActiveTrack } = useTrackStore();
  const getModuleStatus = useProgressStore((s) => s.getModuleStatus);
  useProgressStore((s) => s.lessonProgress); // subscribe for reactivity

  const { modules } = loadCurriculum(activeTrackId);

  function handleTrackSwitch(trackId: TrackId) {
    void setActiveTrack(trackId);
    navigate(`/${trackId}`);
  }

  return (
    <aside
      className="flex h-full w-[264px] shrink-0 flex-col"
      style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)" }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="flex size-8 items-center justify-center rounded-lg text-xs font-bold shrink-0"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          FT
        </div>
        <div className="min-w-0">
          <p
            className="text-sm font-semibold leading-tight truncate"
            style={{ color: "var(--text-primary)" }}
          >
            Floci Trainer
          </p>
          <p className="text-xs leading-tight" style={{ color: "var(--text-tertiary)" }}>
            v1.0
          </p>
        </div>
      </div>

      {/* Track switcher */}
      <div className="flex gap-1 p-2" style={{ borderBottom: "1px solid var(--border)" }}>
        {TRACKS.map(({ id, label, Icon }) => {
          const isActive = activeTrackId === id;
          return (
            <button
              key={id}
              onClick={() => handleTrackSwitch(id)}
              title={label}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: isActive ? "var(--bg-overlay)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                border: isActive ? "1px solid var(--border-focus)" : "1px solid transparent",
              }}
            >
              <Icon className="size-3 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Module list */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {modules.length === 0 ? (
          <p
            className="px-2.5 py-4 text-xs text-center"
            style={{ color: "var(--text-tertiary)" }}
          >
            Contenido en camino
          </p>
        ) : (
          modules.map((mod) => {
            const status = getModuleStatus(mod.id);
            const order = String(mod.order).padStart(2, "0");
            const isLocked = status === "locked";

            return (
              <NavLink
                key={mod.id}
                to={`/${activeTrackId}/module/${mod.id}`}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                    isActive
                      ? "text-fg"
                      : isLocked
                      ? "opacity-40 cursor-default pointer-events-none"
                      : "hover:bg-overlay"
                  )
                }
                style={({ isActive }) => ({
                  background: isActive ? "var(--bg-overlay)" : undefined,
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                })}
                onClick={(e) => isLocked && e.preventDefault()}
              >
                <StatusDot status={status} />
                <span
                  className="font-mono text-xs shrink-0 w-5 text-right"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {order}
                </span>
                <span className="flex-1 truncate leading-tight text-xs font-medium">
                  {mod.title}
                </span>
                {mod.serviceTag && (
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono leading-none"
                    style={{
                      background: "var(--bg-overlay)",
                      color: "var(--text-tertiary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {mod.serviceTag}
                  </span>
                )}
              </NavLink>
            );
          })
        )}
      </nav>

      {/* Footer */}
      <div className="p-2" style={{ borderTop: "1px solid var(--border)" }}>
        <NavLink
          to={`/${activeTrackId}/examples`}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors mb-0.5",
              isActive ? "bg-overlay" : "hover:bg-overlay"
            )
          }
          style={({ isActive }) => ({
            background: isActive ? "var(--bg-overlay)" : undefined,
            color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
          })}
        >
          <Lightbulb className="size-3.5 shrink-0" />
          <span className="text-xs font-medium">Ejemplos</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              isActive ? "bg-overlay" : "hover:bg-overlay"
            )
          }
          style={({ isActive }) => ({
            background: isActive ? "var(--bg-overlay)" : undefined,
            color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
          })}
        >
          <Settings className="size-3.5 shrink-0" />
          <span className="text-xs font-medium">Configuración</span>
        </NavLink>
        <a
          href="https://github.com/hectorvent/floci"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 10,
            color: "var(--text-tertiary)",
            textDecoration: "none",
            display: "block",
            marginTop: 8,
            paddingLeft: 2,
            opacity: 0.6,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
        >
          Powered by Floci
        </a>
      </div>
    </aside>
  );
}
