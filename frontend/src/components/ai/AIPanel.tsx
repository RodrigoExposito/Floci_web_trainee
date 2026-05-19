import { useRef, useState } from "react";
import { X, ArrowUp } from "lucide-react";
import { useAiStore } from "@/stores/ai-store";
import { AiMessages } from "./AiMessages";

export function AIPanel() {
  const {
    open,
    setOpen,
    messages,
    loading,
    contextType,
    context,
    challengeContext,
    sendMessage,
  } = useAiStore();

  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 144) + "px";
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  const challengeChips =
    contextType === "challenge" && challengeContext
      ? [
          {
            label: "Explicame el concepto",
            prompt: `Explicame el concepto principal de este desafío: ${challengeContext.objective}`,
          },
          {
            label: "Dame un hint",
            prompt: `Dame un hint para resolver este desafío sin darme la respuesta directa. Ya intenté ${challengeContext.attemptCount} veces.`,
          },
          ...(challengeContext.lastValidationResults
            ? [
                {
                  label: "¿Qué hice mal?",
                  prompt: `Fallé la validación. Resultados: ${challengeContext.lastValidationResults}. ¿Qué puedo estar haciendo mal?`,
                },
              ]
            : []),
        ]
      : null;

  const contextLabel = context.split(". ")[0];

  if (!open) return null;

  return (
    <div
      style={{
        width: 360,
        minWidth: 360,
        height: "100%",
        background: "var(--bg-sidebar)",
        borderLeft: "1px solid var(--border-soft)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--border-soft)",
          flexShrink: 0,
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="ai-dot" />
            <span
              className="font-mono text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-tertiary)" }}
            >
              Asistente Contextual
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="btn btn-icon btn-ghost"
            style={{ padding: 4 }}
            aria-label="Cerrar panel"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <p
          className="text-xs truncate"
          style={{ color: "var(--text-secondary)" }}
          title={contextLabel}
        >
          {contextLabel}
        </p>
      </div>

      <AiMessages
        messages={messages}
        loading={loading}
        contextType={contextType}
        onChipClick={(p) => void sendMessage(p)}
      />

      {challengeChips && (
        <div
          style={{
            padding: "6px 12px 0",
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          {challengeChips.map((chip) => (
            <button
              key={chip.label}
              onClick={() => void sendMessage(chip.prompt)}
              disabled={loading}
              style={{
                background: "none",
                border: "1px solid var(--border-soft)",
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: 11.5,
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "background 0.12s, color 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-elevated)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          borderTop: "1px solid var(--border-soft)",
          padding: "10px 12px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-soft)",
            borderRadius: 10,
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            padding: "8px 10px",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Preguntá lo que quieras..."
            rows={1}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: 13,
              color: "var(--text-primary)",
              lineHeight: 1.5,
              fontFamily: "var(--font-sans)",
            }}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || loading}
            aria-label="Enviar"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--accent)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              opacity: !input.trim() || loading ? 0.4 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <ArrowUp className="size-3.5" style={{ color: "var(--accent-fg)" }} />
          </button>
        </div>
        <p
          className="font-mono text-center mt-1.5"
          style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}
        >
          enter enviar · shift+enter salto de línea
        </p>
      </div>
    </div>
  );
}
