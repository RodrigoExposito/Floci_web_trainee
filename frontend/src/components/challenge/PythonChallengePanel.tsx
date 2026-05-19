import { useState, useRef, useEffect } from "react";
import { Play, CheckCircle, XCircle, Circle, RotateCcw } from "lucide-react";
import { runPythonValidation, type PythonValidationResult } from "@/lib/api";
import type { Challenge } from "@/lib/types";

interface Props {
  challenge: Challenge;
  trackId: string;
  moduleId: string;
  onAllPassed: () => void;
  alreadyCompleted: boolean;
}

export function PythonChallengePanel({
  challenge,
  trackId,
  moduleId: _moduleId,
  onAllPassed,
  alreadyCompleted,
}: Props) {
  const [code, setCode] = useState(challenge.starterCode ?? "");
  const [results, setResults] = useState<PythonValidationResult[] | null>(null);
  const [output, setOutput] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allPassedRef = useRef(false);

  useEffect(() => {
    if (alreadyCompleted && results === null) {
      const completedResults = challenge.validation.commands.map((cmd, i) => ({
        criterion_index: i,
        passed: true,
        actual_output: "(completado previamente)",
        criterion: cmd.criterion,
      }));
      setResults(completedResults);
    }
  }, [alreadyCompleted, challenge.validation.commands, results]);

  const totalValidations = challenge.validation.commands.length;
  const passedCount = results?.filter((r) => r.passed).length ?? 0;
  const allPassed = totalValidations > 0 && passedCount === totalValidations;

  async function run() {
    if (running) return;
    setRunning(true);
    setError(null);
    setOutput("");
    setResults(null);

    const validations = challenge.validation.commands.map((cmd) => ({
      expect: cmd.expect,
      criterion: cmd.criterion,
    }));

    try {
      const res = await runPythonValidation(trackId, challenge.id, code, validations);
      setResults(res.results);
      setOutput(res.stdout || res.stderr);
      if (!allPassedRef.current && res.allPassed) {
        allPassedRef.current = true;
        onAllPassed();
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Editor */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 8,
          overflow: "hidden",
          background: "var(--bg-surface)",
        }}
      >
        <div
          style={{
            padding: "6px 12px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-elevated)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-tertiary)",
            }}
          >
            Python
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => {
                setCode(challenge.starterCode ?? "");
                setResults(null);
                setOutput("");
                setError(null);
              }}
              className="btn btn-ghost btn-sm"
              title="Restaurar el código inicial del challenge"
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}
            >
              <RotateCcw className="size-3" />
              Restaurar
            </button>
            <button
              onClick={() => void run()}
              disabled={running || allPassed}
              className="btn btn-primary btn-sm"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Play className="size-3.5" />
              {running ? "Ejecutando…" : "Ejecutar"}
            </button>
          </div>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          rows={Math.max(12, code.split("\n").length + 2)}
          style={{
            width: "100%",
            padding: "14px 16px",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--text-primary)",
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Output */}
      {(output || error) && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-elevated)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: error ? "var(--danger)" : "var(--text-tertiary)",
              }}
            >
              {error ? "Error" : "Salida"}
            </span>
          </div>
          <pre
            style={{
              margin: 0,
              padding: "12px 16px",
              fontFamily: "var(--font-mono)",
              fontSize: 12.5,
              lineHeight: 1.6,
              color: error ? "var(--danger)" : "var(--text-primary)",
              background: "var(--bg-surface)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            {error ?? output}
          </pre>
        </div>
      )}

      {/* Validation results */}
      {results && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-tertiary)",
              }}
            >
              Validaciones
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: allPassed ? "var(--running)" : "var(--text-tertiary)",
              }}
            >
              {passedCount}/{totalValidations}
            </span>
          </div>
          <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {results.map((r) => (
              <div
                key={r.criterion_index}
                style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
              >
                {r.passed ? (
                  <CheckCircle className="size-4 shrink-0 mt-0.5" style={{ color: "var(--running)" }} />
                ) : (
                  <XCircle className="size-4 shrink-0 mt-0.5" style={{ color: "var(--danger)" }} />
                )}
                <span
                  style={{
                    fontSize: 13,
                    color: r.passed ? "var(--text-primary)" : "var(--danger)",
                    lineHeight: 1.4,
                  }}
                >
                  {r.criterion}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending state */}
      {!results && !error && !running && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "10px 12px",
            border: "1px solid var(--border)",
            borderRadius: 8,
            background: "var(--bg-elevated)",
          }}
        >
          {challenge.validation.commands.map((cmd, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Circle className="size-4 shrink-0" style={{ color: "var(--text-tertiary)" }} />
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{cmd.criterion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
