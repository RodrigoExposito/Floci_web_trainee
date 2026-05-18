import { spawn } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import type { PythonRunResult } from "../types/index.js";

const TIMEOUT_MS = 15_000;

export async function runPython(code: string): Promise<PythonRunResult> {
  const tmpFile = join(tmpdir(), `floci_py_${randomUUID()}.py`);
  await writeFile(tmpFile, code, "utf-8");

  return new Promise((resolve) => {
    let timedOut = false;
    let resolved = false;

    const cleanup = (): void => { unlink(tmpFile).catch(() => {}); };

    const done = (result: PythonRunResult): void => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        cleanup();
        resolve(result);
      }
    };

    const child = spawn("python3", [tmpFile]);

    // SIGKILL is more reliable than SIGTERM for tight infinite loops
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, TIMEOUT_MS);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

    // close always fires, even after SIGKILL
    child.on("close", (code) => {
      done({
        stdout: stdout.trim(),
        stderr: timedOut ? "El código tardó más de 15 segundos" : stderr.trim(),
        exitCode: timedOut ? 1 : (code ?? 1),
        timedOut,
      });
    });

    child.on("error", (err) => {
      done({
        stdout: "",
        stderr: err.message.includes("ENOENT")
          ? "python3 no está disponible en el servidor"
          : err.message,
        exitCode: 1,
        timedOut: false,
      });
    });
  });
}
