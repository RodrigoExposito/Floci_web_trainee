import { spawn, type ChildProcess } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import type { PythonRunResult } from "../types/index.js";

const TIMEOUT_MS = 15_000;

export async function runPython(code: string): Promise<PythonRunResult> {
  const tmpFile = join(tmpdir(), `floci_py_${randomUUID()}.py`);
  let child: ChildProcess | null = null;

  try {
    await writeFile(tmpFile, code, "utf-8");

    child = spawn("python3", [tmpFile]);

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

    const exitCode = await Promise.race<number>([
      new Promise<number>((resolve) => {
        child!.on("close", (code) => resolve(code ?? 1));
      }),
      new Promise<number>((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), TIMEOUT_MS)
      ),
    ]);

    return { exitCode, stdout: stdout.trim(), stderr: stderr.trim(), timedOut: false };
  } catch (err) {
    if (err instanceof Error && err.message === "TIMEOUT") {
      if (child && !child.killed) {
        child.kill("SIGKILL");
        // Wait for the process to actually die before returning
        await new Promise<void>((resolve) => child!.on("close", () => resolve()));
      }
      return {
        exitCode: 1,
        stdout: "",
        stderr: "El código tardó más de 15 segundos",
        timedOut: true,
      };
    }

    if (err instanceof Error && (err as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        exitCode: 1,
        stdout: "",
        stderr: "python3 no está disponible en el servidor",
        timedOut: false,
      };
    }

    throw err;
  } finally {
    // Always clean up the temp file, even if an unexpected error is thrown
    await unlink(tmpFile).catch(() => {});
  }
}
