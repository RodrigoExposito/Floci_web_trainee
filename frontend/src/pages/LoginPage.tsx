import { useState } from "react";
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const { login, loginError, loginLoading } = useAuthStore();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || loginLoading) return;
    await login(password);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-app)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "32px 28px",
        }}
      >
        {/* Logo / title */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--accent-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lock className="size-5" style={{ color: "var(--accent)" }} />
          </div>
          <div className="text-center">
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Floci Trainer
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Ingresá la clave de acceso
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
          <div
            className="flex items-center gap-2"
            style={{
              background: "var(--bg-surface)",
              border: `1px solid ${loginError ? "var(--danger)" : "var(--border)"}`,
              borderRadius: 8,
              padding: "0 12px",
              transition: "border-color 0.15s",
            }}
          >
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Clave de acceso"
              autoFocus
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                fontSize: 14,
                color: "var(--text-primary)",
                padding: "12px 0",
                fontFamily: "var(--font-mono)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-tertiary)",
                padding: 0,
                display: "flex",
              }}
              aria-label={showPassword ? "Ocultar clave" : "Mostrar clave"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {loginError && (
            <p className="text-xs" style={{ color: "var(--danger)" }}>
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={!password.trim() || loginLoading}
            className="btn btn-primary"
            style={{ marginTop: 4 }}
          >
            {loginLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Entrar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
