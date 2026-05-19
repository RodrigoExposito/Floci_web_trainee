import { Link, useParams, useLocation } from "react-router-dom";
import { ChevronRight, Sun, Moon, Sparkles, LogOut } from "lucide-react";
import { FlociStatus } from "@/components/status/FlociStatus";
import { loadModule } from "@/lib/curriculum-loader";
import { useThemeStore } from "@/stores/theme-store";
import { useAiStore } from "@/stores/ai-store";
import { useTrackStore } from "@/stores/track-store";
import { useAuthStore } from "@/stores/auth-store";

interface Crumb {
  label: string;
  to?: string;
}

function useBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation();
  const { trackId, moduleId, lessonId, challengeId } = useParams<{
    trackId?: string;
    moduleId?: string;
    lessonId?: string;
    challengeId?: string;
  }>();
  const activeTrackId = useTrackStore((s) => s.activeTrackId);
  const tid = trackId ?? activeTrackId;

  if (pathname === "/settings") {
    return [{ label: "Dashboard", to: `/${tid}` }, { label: "Configuración" }];
  }

  if (!moduleId) {
    return [{ label: "Dashboard" }];
  }

  const mod = loadModule(tid, moduleId);
  const moduleCrumb = { label: mod?.title ?? moduleId, to: `/${tid}/module/${moduleId}` };

  if (lessonId) {
    return [
      { label: "Dashboard", to: `/${tid}` },
      moduleCrumb,
      { label: `Lección: ${lessonId}` },
    ];
  }

  if (challengeId) {
    return [
      { label: "Dashboard", to: `/${tid}` },
      moduleCrumb,
      { label: `Challenge: ${challengeId}` },
    ];
  }

  return [{ label: "Dashboard", to: `/${tid}` }, { label: mod?.title ?? moduleId }];
}

export function Header() {
  const crumbs = useBreadcrumbs();
  const { theme, toggle: toggleTheme } = useThemeStore();
  const { open: aiOpen, toggle: toggleAi } = useAiStore();
  const { logout, displayName } = useAuthStore();

  return (
    <header
      className="flex h-11 shrink-0 items-center justify-between px-5"
      style={{ background: "var(--bg-app)", borderBottom: "1px solid var(--border)" }}
    >
      <nav className="flex items-center gap-1 text-xs">
        {crumbs.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-1">
            {idx > 0 && (
              <ChevronRight className="size-3" style={{ color: "var(--text-tertiary)" }} />
            )}
            {crumb.to ? (
              <Link
                to={crumb.to}
                className="transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                {crumb.label}
              </Link>
            ) : (
              <span style={{ color: "var(--text-primary)" }}>{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleAi}
          className="btn btn-icon btn-ghost"
          aria-label="Toggle AI assistant"
          aria-pressed={aiOpen}
          title="Asistente IA"
          style={{ color: aiOpen ? "var(--accent)" : "var(--text-secondary)" }}
        >
          <Sparkles className="size-3.5" />
        </button>

        <button
          onClick={toggleTheme}
          className="btn btn-icon btn-ghost"
          aria-label="Toggle theme"
          title={`Cambiar a ${theme === "dark" ? "claro" : "oscuro"}`}
        >
          {theme === "dark" ? (
            <Sun className="size-3.5" style={{ color: "var(--text-secondary)" }} />
          ) : (
            <Moon className="size-3.5" style={{ color: "var(--text-secondary)" }} />
          )}
        </button>

        <FlociStatus />

        <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 2px" }} />

        {displayName && (
          <span
            className="text-xs font-medium px-2"
            style={{ color: "var(--text-secondary)" }}
            title={displayName}
          >
            {displayName}
          </span>
        )}

        <button
          onClick={logout}
          className="btn btn-icon btn-ghost"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--danger)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
    </header>
  );
}
