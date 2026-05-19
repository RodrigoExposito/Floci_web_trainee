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
import { PythonChallengePanel } from "@/components/challenge/PythonChallengePanel";
import { checkFlociStatus, runSingleValidation, recordAttempt, updateWeakArea } from "@/lib/api";
import type { Challenge, ChallengeCell, CellState } from "@/lib/types";

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full"
          style={{ background: i <= level ? "var(--accent)" : "var(--border-focus)" }}
        />
      ))}
    </div>
  );
}

export default function ChallengeView() {
  const { trackId, moduleId, challengeId } = useParams<{
    trackId: string;
    moduleId: string;
    challengeId: string;
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

  useEffect(() => {
    if (!trackId || !moduleId || !challengeId) return;
    loadChallenge(trackId, moduleId, challengeId).then((ch) => {
      if (!ch) return;
      setChallenge(ch);
      const newCells = transformChallengeToCells(ch);
      setCells(newCells);
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

  useEffect(() => {
    if (!challenge || !moduleId || !trackId) return;
    const mod = loadModule(trackId, moduleId);
    const context = [
      `Módulo: ${mod?.title ?? moduleId}`,
      `Challenge: ${challenge.title}`,
      `Objetivo: ${challenge.objective}`,
      `Instrucciones: ${challenge.instructions.join(" / ")}`,
    ].join(". ");
    setContext("challenge", context);
    setChallengeContext({ objective: challenge.objective, attemptCount: 0, lastValidationResults: "" });
    return () => { setChallengeContext(null); };
  }, [challenge, moduleId, trackId]);

  // Poll Floci status every 10 s (only for AWS challenges)
  useEffect(() => {
    if (!challenge || challenge.challengeType === "python") return;

    async function check() {
      const ok = await checkFlociStatus();
      setFlociRunning(ok);
    }
    void check();
    const id = setInterval(() => void check(), 10_000);
    return () => clearInterval(id);
  }, [challenge]);

  const codeCells = getCodeCells(cells);
  const passedCount = codeCells.filter(({ globalIndex }) => cellStates[globalIndex]?.status === "passed").length;
  const awsAllPassed = codeCells.length > 0 && passedCount === codeCells.length;
  const alreadyCompleted = !!moduleId && !!challengeId && getLessonStatus(moduleId, challengeId) === "completed";
  const allPassed = awsAllPassed || pythonPassed || alreadyCompleted;

  // Auto-complete when all AWS CLI cells pass
  useEffect(() => {
    if (!awsAllPassed || !moduleId || !challengeId || !challenge) return;
    if (challenge.challengeType === "python") return;
    if (getLessonStatus(moduleId, challengeId) === "completed") return;
    void markCompleted(moduleId, challengeId);
    consecutiveFailuresRef.current = 0;
    const results = codeCells.map(({ cell, globalIndex }) => ({
      criterion_index: cell.validationIndex,
      passed: cellStates[globalIndex]?.status === "passed",
      actual_output: cellStates[globalIndex]?.output ?? "",
      criterion: cellStates[globalIndex]?.criterion ?? "",
    }));
    if (trackId) {
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
      const status = result.passed ? "passed" : "failed";
      setCellStates((s) => ({
        ...s,
        [globalIndex]: { status, output: result.actual_output, criterion: cmd.criterion },
      }));
      if (result.passed && globalIndex < cells.length - 1) setFocusedCell(globalIndex + 1);
      recordAttempt(trackId, challenge.id, result.passed, JSON.stringify({ cmd: cmd.cmd, result })).catch(console.error);
    } catch (err) {
      setCellStates((s) => ({
        ...s,
        [globalIndex]: { status: "failed", output: String(err), criterion: cmd.criterion },
      }));
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

    setCellStates((currentStates) => {
      const anyFailed = codeCells.some(({ globalIndex }) => currentStates[globalIndex]?.status === "failed");
      if (anyFailed) {
        consecutiveFailuresRef.current += 1;
        const failCount = consecutiveFailuresRef.current;
        if (failCount >= 2) {
          updateWeakArea(trackId, moduleId, challenge.title, failCount).catch(console.error);
        }
        const resultsStr = codeCells
          .map(({ globalIndex }) => {
            const s = currentStates[globalIndex];
            return s ? `${s.criterion}: ${s.status === "passed" ? "✓" : "✗"} ${s.output ?? ""}` : "";
          })
          .filter(Boolean)
          .join(" | ");
        setChallengeContext({
          objective: challenge.objective,
          attemptCount: failCount,
          lastValidationResults: resultsStr,
        });
      } else {
        consecutiveFailuresRef.current = 0;
      }
      return currentStates;
    });
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        const cell = cells[focusedCell];
        if (cell?.kind === "code") void runCell(focusedCell);
      }
      if (e.key === "ArrowDown") setFocusedCell((f) => Math.min(f + 1, cells.length - 1));
      if (e.key === "ArrowUp") setFocusedCell((f) => Math.max(f - 1, 0));
      if (e.key === "Escape") setFocusedCell(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cells, focusedCell, runCell]);

  if (!trackId || !moduleId || !challengeId) return null;
  if (!challenge) {
    return (
      <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Cargando challenge...
      </div>
    );
  }

  const mod = loadModule(trackId, moduleId);
  const meta = getModuleMeta(trackId, moduleId);
  const challengeIdx = meta?.challenges.indexOf(challengeId) ?? 0;
  const nextChallengeId = meta?.challenges[challengeIdx + 1];
  const isLast = !nextChallengeId;

  return (
    <div className="mx-auto max-w-3xl pb-16 fade-in">
      <div className="flex items-center gap-2 mb-2">
        {mod?.serviceTag && (
          <span
            className="rounded px-2 py-0.5 text-xs font-mono"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            {mod.serviceTag}
          </span>
        )}
        <span
          className="text-xs font-mono font-semibold uppercase tracking-widest flex-1"
          style={{ color: "var(--text-tertiary)" }}
        >
          CHALLENGE {String(challengeIdx + 1).padStart(2, "0")}
        </span>
        <DifficultyDots level={challenge.difficulty} />
      </div>

      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
        {challenge.title}
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)", fontSize: 15 }}>
        {challenge.objective}
      </p>

      <StepsPanel
        instructions={challenge.instructions}
        passedCount={
          challenge.challengeType === "python"
            ? (allPassed ? challenge.validation.commands.length : 0)
            : passedCount
        }
        totalCodeCells={challenge.challengeType === "python" ? challenge.validation.commands.length : codeCells.length}
      />

      {challenge.challengeType === "python" ? (
        <PythonChallengePanel
          challenge={challenge}
          trackId={trackId}
          moduleId={moduleId}
          alreadyCompleted={alreadyCompleted}
          onAllPassed={() => {
            setPythonPassed(true);
            if (getLessonStatus(moduleId, challengeId) === "completed") return;
            void markCompleted(moduleId, challengeId);
            // attempt is already recorded by the backend /api/validate/python endpoint
          }}
        />
      ) : (
        <div className="cells">
          {cells.map((cell, i) => (
            <NotebookCell
              key={i}
              cell={cell}
              globalIndex={i}
              focused={focusedCell === i}
              state={cellStates[i] ?? { status: "idle" }}
              flociRunning={flociRunning}
              onFocus={() => setFocusedCell(i)}
              onRun={() => void runCell(i)}
            />
          ))}
        </div>
      )}

      <div
        className="flex items-center justify-between pt-5 mt-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          {challenge.challengeType !== "python" && (
            <button
              onClick={() => void runAll()}
              disabled={!flociRunning || runningAll || allPassed}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              title={!flociRunning ? "Floci no está corriendo" : undefined}
            >
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
          <button
            onClick={() => navigate(`/${trackId}/module/${moduleId}`)}
            className="btn btn-ghost btn-sm"
          >
            Volver al módulo
          </button>
          {!isLast ? (
            <button
              onClick={() => navigate(`/${trackId}/module/${moduleId}/challenge/${nextChallengeId}`)}
              className="btn btn-secondary btn-sm flex items-center gap-1"
            >
              Siguiente challenge <ChevronRight className="size-3.5" />
            </button>
          ) : (
            <button
              onClick={() => navigate(`/${trackId}/module/${moduleId}`)}
              className="btn btn-secondary btn-sm"
            >
              Terminar módulo
            </button>
          )}
        </div>
      </div>

      {challenge.challengeType !== "python" && (
        <p className="text-center text-xs mt-4" style={{ color: "var(--text-tertiary)" }}>
          Shift+Enter ejecuta · ↑↓ navega celdas · Esc quita foco
        </p>
      )}
    </div>
  );
}
