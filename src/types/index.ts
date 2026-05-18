export type ProgressStatus = "locked" | "active" | "completed";

export interface ProgressRecord {
  id: number;
  track_id: string;
  module_id: string;
  lesson_id: string;
  status: ProgressStatus;
  completed_at: string | null;
}

export interface ChallengeAttempt {
  id: number;
  track_id: string;
  challenge_id: string;
  attempt_number: number;
  passed: boolean;
  feedback: string;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface WeakArea {
  id: number;
  track_id: string;
  module_id: string;
  topic: string;
  miss_count: number;
}

export interface ValidationCommand {
  cmd: string;
  expect: string;
  criterion: string;
}

export interface ValidationResult {
  criterion: string;
  passed: boolean;
  actual_output: string;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
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

export interface PythonValidation {
  expect: string;   // "exit_code_0" | "stdout_contains:X" | "no_exception"
  criterion: string;
}

export interface PythonRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export interface ApiOk<T> {
  ok: true;
  data: T;
}

export type ApiResponse<T> = ApiOk<T> | ApiError;
