// ── Curriculum ───────────────────────────────────────────────────────────────

export interface Module {
  id: string;
  title: string;
  description: string;
  serviceTag: string;
  prereqs: string[];
  order: number;
}

export interface Curriculum {
  modules: Module[];
}

// ── Module Meta (per-module manifest in content/modules/[id]/meta.json) ──────

export interface ModuleMeta {
  id: string;
  title: string;
  description: string;
  prereqs: string[];
  lessons: string[];    // lesson IDs in display order
  challenges: string[]; // challenge IDs in display order
}

// ── Lesson ───────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string; // raw markdown
}

// ── Challenge ────────────────────────────────────────────────────────────────

export type ChallengeType = "aws-cli" | "python";

export interface ValidationCommand {
  cmd?: string;         // required for aws-cli, absent for python
  expect: string;       // "exit_code_0" | "contains:<str>" | "stdout_contains:<str>" | "no_exception"
  criterion: string;
}

export type CleanupResourceType =
  | "s3-bucket"
  | "sqs-queue"
  | "dynamodb-table"
  | "lambda-function";

export interface CleanupResource {
  type: CleanupResourceType;
  name: string;
}

export interface Challenge {
  id: string;
  title: string;
  difficulty: 1 | 2 | 3;
  challengeType?: ChallengeType;
  starterCode?: string; // Python challenges: pre-filled editor code
  objective: string;
  scenario: string;
  instructions: string[];
  hints: string[];
  validation: {
    commands: ValidationCommand[];
  };
  cleanup?: CleanupResource[]; // AWS resources to delete after challenge
}

// ── Progress ─────────────────────────────────────────────────────────────────

export type ProgressStatus = "locked" | "active" | "completed";

export interface ProgressRecord {
  id: number;
  track_id: string;
  module_id: string;
  lesson_id: string;
  status: ProgressStatus;
  completed_at: string | null;
}

// ── Challenge notebook cells ──────────────────────────────────────────────────

export interface ChallengeCell {
  kind: "markdown" | "code" | "hints";
  body: string;
  validationIndex?: number; // connects code cell to challenge.validation.commands[i]
  hints?: string[];         // for kind: "hints" cells
}

export type CellStatus = "idle" | "running" | "passed" | "failed";

export interface CellState {
  status: CellStatus;
  output?: string;
  criterion?: string;
}

// ── Examples ─────────────────────────────────────────────────────────────────

export interface ExampleBlock {
  type: "text" | "code" | "result" | "note";
  content: string;
  language?: string; // for code blocks
  caption?: string;  // for code blocks
}

export interface Example {
  id: string;
  title: string;
  category: string;
  difficulty: 1 | 2 | 3;
  description: string;
  context: string;
  blocks: ExampleBlock[];
  updatedAt: string;
}

export interface ExampleMeta {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 1 | 2 | 3;
}

// ── Curriculum item (lesson or challenge, for ModuleView list) ────────────────

export type CurriculumItemType = "lesson" | "challenge";

export interface CurriculumItem {
  type: CurriculumItemType;
  id: string;
  title: string;
  status: ProgressStatus;
}
