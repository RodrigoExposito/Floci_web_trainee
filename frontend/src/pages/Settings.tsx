import { useState, useEffect } from "react";
import { Key, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAiStore } from "@/stores/ai-store";
import { getSetting, setSetting, callAi } from "@/lib/api";

type TestStatus = "idle" | "testing" | "success" | "error";

export default function Settings() {
  const { checkApiKey } = useAiStore();

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testError, setTestError] = useState("");

  useEffect(() => {
    getSetting("groq_api_key")
      .then((val) => { if (val) setApiKey(val); })
      .catch(() => {});
  }, []);

  async function handleSave() {
    const trimmed = apiKey.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setSaved(false);
    try {
      await setSetting("groq_api_key", trimmed);
      setSaved(true);
      await checkApiKey();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save API key:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    const trimmed = apiKey.trim();
    if (!trimmed || testStatus === "testing") return;
    setTestStatus("testing");
    setTestError("");
    try {
      await setSetting("groq_api_key", trimmed);
      await checkApiKey();
      await callAi("Respondé solo 'ok'", "test de conexión", "aws");
      setTestStatus("success");
    } catch (err) {
      setTestStatus("error");
      const msg = String(err);
      if (msg.includes("HTTP_ERROR")) setTestError("Error de conexión");
      else setTestError(msg);
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

      <section
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Key className="size-4" style={{ color: "var(--accent)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Groq API Key
          </h2>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
          Requerida para el asistente IA. Gratis en{" "}
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent)" }}
          >
            console.groq.com/keys
          </a>
          .
        </p>

        <div className="flex gap-2 mb-3">
          <div
            className="flex flex-1 items-center gap-2"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "0 12px",
            }}
          >
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestStatus("idle");
              }}
              placeholder="gsk_..."
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "var(--text-primary)",
                padding: "10px 0",
                fontFamily: "var(--font-mono)",
              }}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-tertiary)",
                padding: 0,
                display: "flex",
              }}
              aria-label={showKey ? "Ocultar key" : "Mostrar key"}
            >
              {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <button
            onClick={() => void handleSave()}
            disabled={!apiKey.trim() || saving}
            className="btn btn-primary btn-sm"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : "Guardar"}
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => void handleTest()}
            disabled={!apiKey.trim() || testStatus === "testing"}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
          >
            {testStatus === "testing" && <Loader2 className="size-3.5 animate-spin" />}
            Probar conexión
          </button>
          {testStatus === "success" && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--running)" }}>
              <CheckCircle className="size-3.5" />
              Conexión exitosa
            </span>
          )}
          {testStatus === "error" && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--danger)" }}>
              <XCircle className="size-3.5" />
              {testError}
            </span>
          )}
          {saved && testStatus === "idle" && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--running)" }}>
              <CheckCircle className="size-3.5" />
              Guardada
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
