import type { Challenge, ChallengeCell } from "@/lib/types";

export function transformChallengeToCells(challenge: Challenge): ChallengeCell[] {
  const cells: ChallengeCell[] = [];
  const cmds = challenge.validation.commands;

  cells.push({ kind: "markdown", body: challenge.scenario });

  challenge.instructions.forEach((instruction, i) => {
    cells.push({
      kind: "markdown",
      body: `**Paso ${i + 1}** — ${instruction}`,
    });

    if (i < cmds.length) {
      cells.push({
        kind: "code",
        body: cmds[i].cmd ?? "",
        validationIndex: i,
      });
    }
  });

  for (let i = challenge.instructions.length; i < cmds.length; i++) {
    cells.push({
      kind: "code",
      body: cmds[i].cmd ?? "",
      validationIndex: i,
    });
  }

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
