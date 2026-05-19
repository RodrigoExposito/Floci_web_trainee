import { useState } from "react";
import { Eye, EyeOff, User, Lock, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const { login, loginError, loginLoading } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function doLogin() {
    if (!username.trim() || !password || loginLoading) return;
    await login(username.trim(), password);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await doLogin();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") void doLogin();
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--bg-surface)",
    border: `1px solid ${loginError ? "var(--danger)" : "var(--border)"}`,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 12px",
    transition: "border-color 0.15s",
  };

  const fieldStyle: React.CSSProperties = {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    fontSize: 14,
    color: "var(--text-primary)",
    padding: "12px 0",
  };

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
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Floci Trainer
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Iniciá sesión para continuar
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
          {/* Username */}
          <div style={{ ...inputStyle, borderColor: loginError ? "var(--danger)" : "var(--border)" }}>
            <User className="size-4 shrink-0" style={{ color: "var(--text-tertiary)" }} />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuario"
              autoFocus
              autoComplete="username"
              onKeyDown={handleKeyDown}
              style={fieldStyle}
            />
          </div>

          {/* Password */}
          <div style={{ ...inputStyle, borderColor: loginError ? "var(--danger)" : "var(--border)" }}>
            <Lock className="size-4 shrink-0" style={{ color: "var(--text-tertiary)" }} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              onKeyDown={handleKeyDown}
              style={{ ...fieldStyle, fontFamily: showPassword ? undefined : "var(--font-mono)" }}
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
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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
            disabled={!username.trim() || !password || loginLoading}
            className="btn btn-primary"
            style={{ marginTop: 4 }}
          >
            {loginLoading ? <Loader2 className="size-4 animate-spin" /> : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
