import { useState } from "react";
import { Lightbulb, ChevronDown } from "lucide-react";

interface HintAccordionProps {
  hints: string[];
}

export function HintAccordion({ hints }: HintAccordionProps) {
  const [revealed, setRevealed] = useState(0);
  const [open, setOpen] = useState(false);

  function handleClick() {
    if (!open) {
      setOpen(true);
      setRevealed(1);
    } else if (revealed < hints.length) {
      setRevealed(revealed + 1);
    }
  }

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-soft)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
        style={{ cursor: "pointer", background: "transparent", border: "none", width: "100%" }}
      >
        <Lightbulb className="size-4 shrink-0" style={{ color: "var(--accent)" }} />
        <span className="flex-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {open && revealed > 0
            ? `${revealed} de ${hints.length} hints — click para más`
            : "💡 Hints disponibles (click para revelar)"}
        </span>
        <ChevronDown
          className="size-4 shrink-0 transition-transform"
          style={{
            color: "var(--text-tertiary)",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {open && (
        <div
          style={{
            borderTop: "1px solid var(--border-soft)",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {hints.slice(0, revealed).map((hint, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="font-mono text-xs shrink-0 mt-0.5" style={{ color: "var(--accent)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.55 }}>
                {hint}
              </span>
            </div>
          ))}
          {revealed < hints.length && (
            <button
              onClick={handleClick}
              className="text-xs self-start mt-1"
              style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              + Revelar siguiente hint
            </button>
          )}
        </div>
      )}
    </div>
  );
}
