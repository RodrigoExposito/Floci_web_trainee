interface StepsPanelProps {
  instructions: string[];
  passedCount: number;
  totalCodeCells: number;
}

export function StepsPanel({ instructions, passedCount, totalCodeCells }: StepsPanelProps) {
  const progressPct =
    totalCodeCells > 0 ? Math.round((passedCount / totalCodeCells) * 100) : 0;
  const allDone = totalCodeCells > 0 && passedCount === totalCodeCells;

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-soft)",
        borderRadius: 10,
        padding: "14px 18px",
        marginBottom: 24,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-tertiary)",
          }}
        >
          PASOS
        </span>
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: allDone ? "var(--running)" : "var(--text-tertiary)",
            }}
          >
            {passedCount}/{totalCodeCells} celdas
          </span>
          <div
            style={{
              width: 64,
              height: 4,
              background: "var(--border)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: "var(--running)",
                borderRadius: 2,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>

      <ol
        style={{
          paddingLeft: 20,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {instructions.map((step, i) => (
          <li
            key={i}
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: i < passedCount ? "var(--text-secondary)" : "var(--text-primary)",
              textDecoration: i < passedCount ? "line-through" : "none",
            }}
          >
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
