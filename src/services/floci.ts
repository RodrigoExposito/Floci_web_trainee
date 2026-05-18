import { spawn } from "child_process";
import type { CommandResult, CleanupResource } from "../types/index.js";

const FLOCI_ENDPOINT = process.env["FLOCI_ENDPOINT"] ?? "http://localhost:4566";

const AWS_CREDS: NodeJS.ProcessEnv = {
  AWS_ACCESS_KEY_ID: "test",
  AWS_SECRET_ACCESS_KEY: "test",
  AWS_DEFAULT_REGION: "us-east-1",
};

/** Replace (or inject) --endpoint-url in a command so it always points to FLOCI_ENDPOINT. */
function withEndpoint(cmd: string): string {
  if (cmd.includes("--endpoint-url")) {
    return cmd.replace(/--endpoint-url\s+\S+/, `--endpoint-url ${FLOCI_ENDPOINT}`);
  }
  return `${cmd} --endpoint-url ${FLOCI_ENDPOINT}`;
}

export async function checkFlociStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${FLOCI_ENDPOINT}/_localstack/health`, {
      signal: AbortSignal.timeout(3_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function executeAwsCommand(cmd: string): Promise<CommandResult> {
  // Basic guard: only allow commands starting with "aws"
  if (!/^\s*aws\s/.test(cmd)) {
    return { stdout: "", stderr: "Only 'aws ...' commands are allowed", exitCode: 1 };
  }

  return new Promise((resolve) => {
    const finalCmd = withEndpoint(cmd);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const child = spawn("sh", ["-c", finalCmd], {
      env: { ...process.env, ...AWS_CREDS },
      signal: controller.signal,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: code ?? 1 });
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      resolve({
        stdout: stdout.trim(),
        stderr: err.name === "AbortError" ? "Command timed out after 15s" : err.message,
        exitCode: 1,
      });
    });
  });
}

export function evaluateExpect(expect: string, result: CommandResult): boolean {
  if (expect === "exit_code_0") return result.exitCode === 0;
  if (expect.startsWith("contains:")) {
    const needle = expect.slice("contains:".length);
    return result.stdout.toLowerCase().includes(needle.toLowerCase());
  }
  return false;
}

/** Run cleanup for a single resource. Silently ignores "not found" errors. */
export async function cleanupResource(resource: CleanupResource): Promise<void> {
  switch (resource.type) {
    case "s3-bucket": {
      await executeAwsCommand(`aws s3 rm s3://${resource.name} --recursive`);
      await executeAwsCommand(`aws s3api delete-bucket --bucket ${resource.name}`);
      break;
    }
    case "sqs-queue": {
      const urlResult = await executeAwsCommand(
        `aws sqs get-queue-url --queue-name ${resource.name}`
      );
      if (urlResult.exitCode !== 0) break; // queue doesn't exist — skip silently
      try {
        const parsed = JSON.parse(urlResult.stdout) as { QueueUrl: string };
        await executeAwsCommand(`aws sqs delete-queue --queue-url ${parsed.QueueUrl}`);
      } catch {
        // JSON parse failed — skip
      }
      break;
    }
    case "dynamodb-table": {
      await executeAwsCommand(`aws dynamodb delete-table --table-name ${resource.name}`);
      break;
    }
    case "lambda-function": {
      await executeAwsCommand(`aws lambda delete-function --function-name ${resource.name}`);
      break;
    }
  }
}
