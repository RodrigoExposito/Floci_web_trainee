import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AiMessage, AiContextType } from "@/stores/ai-store";

const GENERAL_CHIPS = [
  "Explicame esto más simple, como si fuera nuevo en AWS",
  "Dame un ejemplo de código adicional",
  "¿Cuándo NO usaría esto en producción?",
  "Hacéme un quiz rápido de esta lección",
];

interface Props {
  messages: AiMessage[];
  loading: boolean;
  contextType: AiContextType;
  onChipClick: (prompt: string) => void;
}

export function AiMessages({ messages, loading, contextType, onChipClick }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const showGeneralChips = messages.length === 0 && contextType !== "challenge";

  return (
    <div
      className="flex-1 overflow-y-auto p-4 flex flex-col gap-4"
      style={{ minHeight: 0 }}
    >
      {showGeneralChips && (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              ¿En qué te ayudo?
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              Conozco el contexto. Probá una sugerencia o escribime una pregunta.
            </p>
          </div>
          {GENERAL_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => onChipClick(chip)}
              style={{
                background: "none",
                border: "1px solid var(--border-soft)",
                borderRadius: 8,
                padding: "10px 12px",
                textAlign: "left",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: 12.5,
                lineHeight: 1.5,
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {messages.length === 0 && contextType === "challenge" && (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            ¿En qué te ayudo?
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Usá los chips de abajo o escribime una pregunta.
          </p>
        </div>
      )}

      {messages.map((msg) =>
        msg.role === "user" ? (
          <div key={msg.id} className="flex justify-end">
            <div
              style={{
                background: "var(--accent-dim)",
                border: "1px solid var(--accent-dim)",
                borderRadius: "12px 12px 4px 12px",
                padding: "10px 12px",
                maxWidth: "85%",
                fontSize: 13,
                color: "var(--text-primary)",
                lineHeight: 1.5,
              }}
            >
              {msg.content}
            </div>
          </div>
        ) : (
          <div key={msg.id}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="ai-dot" style={{ width: 6, height: 6 } as React.CSSProperties} />
              <span
                className="font-mono uppercase tracking-wider"
                style={{ fontSize: 10, color: "var(--text-tertiary)" }}
              >
                Asistente
              </span>
            </div>
            <div
              className="prose prose-sm max-w-none"
              style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--text-primary)" }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        )
      )}

      {loading && (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="ai-dot" style={{ width: 6, height: 6 } as React.CSSProperties} />
            <span
              className="font-mono uppercase tracking-wider"
              style={{ fontSize: 10, color: "var(--text-tertiary)" }}
            >
              Asistente
            </span>
          </div>
          <div className="dots" style={{ color: "var(--text-tertiary)", fontSize: 14 }}>
            <span>●</span>
            <span>●</span>
            <span>●</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
