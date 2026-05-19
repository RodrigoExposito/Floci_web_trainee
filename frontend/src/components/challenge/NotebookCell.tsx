import React from "react";
import { Hash, Terminal } from "lucide-react";
import { HintAccordion } from "./HintAccordion";
import type { ChallengeCell, CellState } from "@/lib/types";

interface NotebookCellProps {
  cell: ChallengeCell;
  globalIndex: number;
  focused: boolean;
  state: CellState;
  flociRunning: boolean;
  onFocus: () => void;
  onRun: () => void;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i}>{part.slice(1, -1)}</code>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function highlightCmd(cmd: string): React.ReactNode {
  const parts = cmd.split(/\s+/);
  return parts.map((part, i) => {
    let color: string | undefined;
    if (i === 0) color = "var(--code-keyword)";
    else if (part.startsWith("--")) color = "var(--code-flag)";
    else if (part.startsWith("http")) color = "var(--code-string)";
    else if (part.startsWith("#")) color = "var(--code-comment)";
    return (
      <span key={i} style={color ? { color } : undefined}>
        {part}
        {i < parts.length - 1 ? " " : ""}
      </span>
    );
  });
}

export function NotebookCell({
  cell,
  globalIndex,
  focused,
  state,
  flociRunning,
  onFocus,
  onRun,
}: NotebookCellProps) {
  const isSuccess = state.status === "passed";
  const isError = state.status === "failed";
  const isRunning = state.status === "running";
  const label = `CELL ${String(globalIndex + 1).padStart(2, "0")}`;

  const cellClass = [
    "cell",
    focused ? "focus" : "",
    isSuccess ? "success" : "",
    isError ? "error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (cell.kind === "hints") {
    return (
      <div className={cellClass} onClick={onFocus} tabIndex={0} onFocus={onFocus}>
        <HintAccordion hints={cell.hints ?? []} />
      </div>
    );
  }

  return (
    <div className={cellClass} onClick={onFocus} tabIndex={0} onFocus={onFocus}>
      <div className="cell-head">
        <span className="kind">
          {cell.kind === "markdown" ? (
            <><Hash className="size-3" /> MD · {label}</>
          ) : (
            <><Terminal className="size-3" /> $ SH · {label}</>
          )}
        </span>
        {cell.kind === "code" && (
          <button
            onClick={(e) => { e.stopPropagation(); onRun(); }}
            disabled={!flociRunning || isRunning}
            className={`run-btn ${isSuccess ? "ghost" : "primary"}`}
            title={!flociRunning ? "Floci no está corriendo" : undefined}
          >
            {isRunning ? (
              <span className="dots">
                ejecutando<span>.</span><span>.</span><span>.</span>
              </span>
            ) : isSuccess ? "Re-ejecutar" : "Ejecutar"}
          </button>
        )}
      </div>

      <div className={`cell-body ${cell.kind === "code" ? "code-cell" : "prose-cell"}`}>
        {cell.kind === "markdown" ? (
          <p style={{ margin: 0 }}>{renderInline(cell.body)}</p>
        ) : (
          <pre><code>{highlightCmd(cell.body)}</code></pre>
        )}
      </div>

      {cell.kind === "code" && state.status !== "idle" && (
        <div className="cell-output">
          <div className="muted">$ {cell.body.split(" ")[0]} ...</div>
          {isRunning ? (
            <div className="muted dots">
              executing on floci<span>.</span><span>.</span><span>.</span>
            </div>
          ) : (
            <>
              {state.output && (
                <div
                  style={{
                    margin: "4px 0",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    color: "var(--text-secondary)",
                  }}
                >
                  {state.output.slice(0, 500) || "(sin output)"}
                </div>
              )}
              {isSuccess ? (
                <div className="ok">✓ {state.criterion}</div>
              ) : (
                <div className="err">✗ {state.criterion}</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
