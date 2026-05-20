import type { Challenge, ChallengeCell } from "@/lib/types";

export function transformChallengeToCells(challenge: Challenge): ChallengeCell[] {
  const cells: ChallengeCell[] = [];
  const cmds = challenge.validation.commands;

  cells.push({ kind: "markdown", body: challenge.scenario });

  // All instructions as pure markdown — never paired 1:1 with validation cmds
  challenge.instructions.forEach((instruction, i) => {
    cells.push({
      kind: "markdown",
      body: `**Paso ${i + 1}** — ${instruction}`,
    });
  });

  // All validation commands as executable cells, after instructions
  cmds.forEach((cmd, i) => {
    cells.push({
      kind: "code",
      body: cmd.cmd ?? "",
      validationIndex: i,
    });
  });

  if (challenge.hints.length > 0) {
    cells.push({ kind: "hints", body: "", hints: challenge.hints });
  }

  return cells;
}

export function getCodeCells(
  cells: ChallengeCell[]
): Array<{ cell: ChallengeCell; globalIndex: number }> {
  return cells
    .map((cell, globalIndex) => ({ cell, globalIndex }))
    .filter(({ cell }) => cell.kind === "code");
}
