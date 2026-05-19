import { LogOut, Bot, Cpu } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";

export default function Settings() {
  const { logout } = useAuthStore();
  const { theme, toggle: toggleTheme } = useThemeStore();

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
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>
              Tema
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {theme === "dark" ? "Modo oscuro activo" : "Modo claro activo"}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-sm"
          >
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
          El asistente usa <strong style={{ color: "var(--text-primary)" }}>Groq / llama-3.3-70b-versatile</strong>.
          La API key está configurada en el servidor — no se necesita ninguna acción de tu parte.
        </p>
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
