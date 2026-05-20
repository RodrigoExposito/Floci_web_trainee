import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Play, ChevronRight, CheckCircle } from "lucide-react";
import { loadChallenge, loadModule } from "@/lib/curriculum-loader";
import { getModuleMeta } from "@/lib/module-registry";
import { useProgressStore } from "@/stores/progress-store";
import { useAiStore } from "@/stores/ai-store";
import { transformChallengeToCells, getCodeCells } from "@/lib/challenge-cells";
import { NotebookCell } from "@/components/challenge/NotebookCell";
import { StepsPanel } from "@/components/challenge/StepsPanel";
import { ChallengeRightPanel } from "@/components/challenge/ChallengeRightPanel";
import { CleanupButton } from "@/components/challenge/CleanupButton";
import { checkFlociStatus, runSingleValidation, recordAttempt, updateWeakArea, cleanupChallenge } from "@/lib/api";
import type { Challenge, ChallengeCell, CellState } from "@/lib/types";

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <span key={i} className="size-1.5 rounded-full"
          style={{ background: i <= level ? "var(--accent)" : "var(--border-focus)" }} />
      ))}
    </div>
  );
}

export default function ChallengeView() {
  const { trackId, moduleId, challengeId } = useParams<{
    trackId: string; moduleId: string; challengeId: string;
  }>();
  const navigate = useNavigate();
  const { getLessonStatus, markCompleted } = useProgressStore();
  const { setContext, setChallengeContext } = useAiStore();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [cells, setCells] = useState<ChallengeCell[]>([]);
  const [cellStates, setCellStates] = useState<Record<number, CellState>>({});
  const [focusedCell, setFocusedCell] = useState(-1);
  const [flociRunning, setFlociRunning] = useState(false);
  const [runningAll, setRunningAll] = useState(false);
  const [pythonPassed, setPythonPassed] = useState(false);
  const consecutiveFailuresRef = useRef(0);
  const challengeRef = useRef<Challenge | null>(null);

  useEffect(() => {
    if (!trackId || !moduleId || !challengeId) return;
    loadChallenge(trackId, moduleId, challengeId).then((ch) => {
      if (!ch) return;
      setChallenge(ch);
      challengeRef.current = ch;
      const newCells = transformChallengeToCells(ch);
      setCells(newCells);
      setCellStates({});
      setPythonPassed(false);
      consecutiveFailuresRef.current = 0;
      if (getLessonStatus(moduleId, challengeId) === "completed") {
        const states: Record<number, CellState> = {};
        newCells.forEach((cell, i) => {
          if (cell.kind === "code" && cell.validationIndex !== undefined) {
            const cmd = ch.validation.commands[cell.validationIndex];
            states[i] = { status: "passed", output: "(completado previamente)", criterion: cmd?.criterion };
          }
        });
        setCellStates(states);
      }
    });
  }, [trackId, moduleId, challengeId]);

  // Auto-cleanup AWS resources when navigating away
  useEffect(() => {
    return () => {
      const ch = challengeRef.current;
      if (ch?.cleanup?.length && trackId) {
        cleanupChallenge(trackId, ch.id, ch.cleanup).catch(() => {});
      }
    };
  }, [trackId, challengeId]);

  useEffect(() => {
    if (!challenge || !moduleId || !trackId) return;
    const mod = loadModule(trackId, moduleId);
    setContext("challenge", [
      `Módulo: ${mod?.title ?? moduleId}`,
      `Challenge: ${challenge.title}`,
      `Objetivo: ${challenge.objective}`,
    ].join(". "));
    setChallengeContext({ objective: challenge.objective, attemptCount: 0, lastValidationResults: "" });
    return () => { setChallengeContext(null); };
  }, [challenge, moduleId, trackId]);

  useEffect(() => {
    if (!challenge || challenge.challengeType === "python") return;
    async function check() { setFlociRunning(await checkFlociStatus()); }
    void check();
    const id = setInterval(() => void check(), 10_000);
    return () => clearInterval(id);
  }, [challenge]);

  const codeCells = getCodeCells(cells);
  const passedCount = codeCells.filter(({ globalIndex }) => cellStates[globalIndex]?.status === "passed").length;
  const awsAllPassed = codeCells.length > 0 && passedCount === codeCells.length;
  const alreadyCompleted = !!moduleId && !!challengeId && getLessonStatus(moduleId, challengeId) === "completed";
  const allPassed = awsAllPassed || pythonPassed || alreadyCompleted;

  useEffect(() => {
    if (!awsAllPassed || !moduleId || !challengeId || !challenge) return;
    if (challenge.challengeType === "python" || getLessonStatus(moduleId, challengeId) === "completed") return;
    void markCompleted(moduleId, challengeId);
    consecutiveFailuresRef.current = 0;
    if (trackId) {
      const results = codeCells.map(({ cell, globalIndex }) => ({
        criterion_index: cell.validationIndex,
        passed: cellStates[globalIndex]?.status === "passed",
        actual_output: cellStates[globalIndex]?.output ?? "",
        criterion: cellStates[globalIndex]?.criterion ?? "",
      }));
      recordAttempt(trackId, challenge.id, true, JSON.stringify(results)).catch(console.error);
    }
  }, [awsAllPassed]);

  const runCell = useCallback(async (globalIndex: number) => {
    if (!challenge || !trackId) return;
    const cell = cells[globalIndex];
    if (!cell || cell.kind !== "code" || cell.validationIndex === undefined) return;
    const cmd = challenge.validation.commands[cell.validationIndex];
    if (!cmd?.cmd) return;
    setCellStates((s) => ({ ...s, [globalIndex]: { status: "running" } }));
    try {
      const result = await runSingleValidation(cmd.cmd, cmd.expect);
      setCellStates((s) => ({
        ...s,
        [globalIndex]: { status: result.passed ? "passed" : "failed", output: result.actual_output, criterion: cmd.criterion },
      }));
      if (result.passed && globalIndex < cells.length - 1) setFocusedCell(globalIndex + 1);
      recordAttempt(trackId, challenge.id, result.passed, JSON.stringify({ cmd: cmd.cmd, result })).catch(console.error);
    } catch (err) {
      setCellStates((s) => ({ ...s, [globalIndex]: { status: "failed", output: String(err), criterion: cmd.criterion } }));
    }
  }, [challenge, cells, trackId]);

  async function runAll() {
    if (!flociRunning || runningAll || allPassed || !challenge || !moduleId || !trackId) return;
    setRunningAll(true);
    for (const { globalIndex } of codeCells) {
      await runCell(globalIndex);
      await new Promise((r) => setTimeout(r, 500));
    }
    setRunningAll(false);
    setCellStates((s) => {
      const anyFailed = codeCells.some(({ globalIndex }) => s[globalIndex]?.status === "failed");
      if (anyFailed) {
        consecutiveFailuresRef.current += 1;
        const n = consecutiveFailuresRef.current;
        if (n >= 2) updateWeakArea(trackId, moduleId, challenge.title, n).catch(console.error);
        const resultsStr = codeCells.map(({ globalIndex }) => {
          const st = s[globalIndex];
          return st ? `${st.criterion}: ${st.status === "passed" ? "✓" : "✗"} ${st.output ?? ""}` : "";
        }).filter(Boolean).join(" | ");
        setChallengeContext({ objective: challenge.objective, attemptCount: n, lastValidationResults: resultsStr });
      } else {
        consecutiveFailuresRef.current = 0;
      }
      return s;
    });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.shiftKey && e.key === "Enter") { e.preventDefault(); const cell = cells[focusedCell]; if (cell?.kind === "code") void runCell(focusedCell); }
      if (e.key === "ArrowDown") setFocusedCell((f) => Math.min(f + 1, cells.length - 1));
      if (e.key === "ArrowUp") setFocusedCell((f) => Math.max(f - 1, 0));
      if (e.key === "Escape") setFocusedCell(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cells, focusedCell, runCell]);

  if (!trackId || !moduleId || !challengeId) return null;
  if (!challenge) {
    return <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--text-secondary)" }}>Cargando challenge...</div>;
  }

  const mod = loadModule(trackId, moduleId);
  const meta = getModuleMeta(trackId, moduleId);
  const challengeIdx = meta?.challenges.indexOf(challengeId) ?? 0;
  const nextChallengeId = meta?.challenges[challengeIdx + 1];

  function resetChallenge() {
    setCellStates({});
    setPythonPassed(false);
    consecutiveFailuresRef.current = 0;
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 pb-16 fade-in">
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Left panel (challenge content) ─────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {mod?.serviceTag && (
              <span className="rounded px-2 py-0.5 text-xs font-mono"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                {mod.serviceTag}
              </span>
            )}
            <span className="text-xs font-mono font-semibold uppercase tracking-widest flex-1" style={{ color: "var(--text-tertiary)" }}>
              CHALLENGE {String(challengeIdx + 1).padStart(2, "0")}
            </span>
            <DifficultyDots level={challenge.difficulty} />
          </div>

          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{challenge.title}</h1>
          <p className="mb-6" style={{ color: "var(--text-secondary)", fontSize: 15 }}>{challenge.objective}</p>

          <StepsPanel
            instructions={challenge.instructions}
            passedCount={challenge.challengeType === "python" ? (allPassed ? challenge.validation.commands.length : 0) : passedCount}
            totalCodeCells={challenge.challengeType === "python" ? challenge.validation.commands.length : codeCells.length}
          />

          {/* AWS CLI cells (python challenges use right panel) */}
          {challenge.challengeType !== "python" && (
            <div className="cells">
              {cells.map((cell, i) => (
                <NotebookCell key={i} cell={cell} globalIndex={i} focused={focusedCell === i}
                  state={cellStates[i] ?? { status: "idle" }} flociRunning={flociRunning}
                  onFocus={() => setFocusedCell(i)} onRun={() => void runCell(i)} />
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-5 mt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <CleanupButton
                trackId={trackId}
                challengeId={challenge.id}
                resources={challenge.cleanup ?? []}
                onReset={resetChallenge}
              />
              {challenge.challengeType !== "python" && (
                <button onClick={() => void runAll()} disabled={!flociRunning || runningAll || allPassed}
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                  title={!flociRunning ? "Floci no está corriendo" : undefined}>
                  <Play className="size-3.5" />
                  Ejecutar todas
                </button>
              )}
              {allPassed && (
                <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--running)" }}>
                  <CheckCircle className="size-4" /> Challenge validado
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(`/${trackId}/module/${moduleId}`)} className="btn btn-ghost btn-sm">
                Volver al módulo
              </button>
              {nextChallengeId ? (
                <button onClick={() => navigate(`/${trackId}/module/${moduleId}/challenge/${nextChallengeId}`)}
                  className="btn btn-secondary btn-sm flex items-center gap-1">
                  Siguiente <ChevronRight className="size-3.5" />
                </button>
              ) : (
                <button onClick={() => navigate(`/${trackId}/module/${moduleId}`)} className="btn btn-secondary btn-sm">
                  Terminar módulo
                </button>
              )}
            </div>
          </div>

          {challenge.challengeType !== "python" && (
            <p className="text-center text-xs mt-3" style={{ color: "var(--text-tertiary)" }}>
              Shift+Enter ejecuta · ↑↓ navega celdas · Esc quita foco
            </p>
          )}
        </div>

        {/* ── Right panel (terminal / python editor) ──────────────────── */}
        <div className="w-full lg:w-[42%] lg:sticky lg:top-4" style={{ height: "calc(100vh - 6rem)", minHeight: 500 }}>
          <ChallengeRightPanel
            challenge={challenge}
            trackId={trackId}
            moduleId={moduleId}
            alreadyCompleted={alreadyCompleted}
            onAllPassed={() => {
              setPythonPassed(true);
              if (getLessonStatus(moduleId, challengeId) === "completed") return;
              void markCompleted(moduleId, challengeId);
            }}
          />
        </div>

      </div>
    </div>
  );
}
