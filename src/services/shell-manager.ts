import * as pty from "node-pty";
import type { IPty } from "node-pty";
import type { WebSocket } from "ws";

interface ShellSession {
  pty: IPty;
  ws: WebSocket;
  lastActivity: number;
}

const sessions = new Map<number, ShellSession>();
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 min

export function createShell(userId: number, ws: WebSocket, cols = 80, rows = 24): void {
  // Kill any existing session for this user
  killShell(userId);

  const shell = pty.spawn("bash", ["--noprofile", "--norc"], {
    name: "xterm-256color",
    cols,
    rows,
    cwd: "/tmp",
    env: {
      ...process.env as Record<string, string>,
      // Floci endpoint — FLOCI_ENDPOINT env var set by Railway, fallback to local
      AWS_ENDPOINT_URL: process.env["FLOCI_ENDPOINT"] ?? "http://localhost:4566",
      AWS_ACCESS_KEY_ID: "test",
      AWS_SECRET_ACCESS_KEY: "test",
      AWS_DEFAULT_REGION: "us-east-1",
      TERM: "xterm-256color",
      HOME: "/tmp",
      // Clean PATH: keep aws + python3 available, nothing else sensitive
      PATH: "/usr/local/bin:/usr/bin:/bin:/usr/local/aws-cli/v2/current/bin",
    },
  });

  const session: ShellSession = { pty: shell, ws, lastActivity: Date.now() };
  sessions.set(userId, session);

  shell.onData((data) => {
    session.lastActivity = Date.now();
    if (ws.readyState === 1 /* WebSocket.OPEN */) {
      ws.send(data);
    }
  });

  shell.onExit(() => {
    sessions.delete(userId);
    if (ws.readyState === 1) {
      ws.send("\r\n\x1b[33m[Shell finalizado. Recargá para iniciar una nueva sesión.]\x1b[0m\r\n");
    }
  });
}

export function killShell(userId: number): void {
  const session = sessions.get(userId);
  if (session) {
    try { session.pty.kill(); } catch { /* already dead */ }
    sessions.delete(userId);
  }
}

export function resizeShell(userId: number, cols: number, rows: number): void {
  const session = sessions.get(userId);
  if (!session) return;
  try { session.pty.resize(cols, rows); } catch { /* ignore */ }
}

export function writeToShell(userId: number, data: string): void {
  const session = sessions.get(userId);
  if (!session) return;
  session.lastActivity = Date.now();
  session.pty.write(data);
}

// Kill idle sessions every 60s
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [userId, session] of sessions.entries()) {
    if (now - session.lastActivity > IDLE_TIMEOUT_MS) {
      console.log(`[terminal] User ${userId} shell timed out after 5min idle`);
      try { session.pty.kill(); } catch { /* ignore */ }
      try { session.ws.close(1000, "Idle timeout"); } catch { /* ignore */ }
      sessions.delete(userId);
    }
  }
}, 60_000);

// Kill all shells on server shutdown
process.on("SIGTERM", () => {
  clearInterval(cleanupInterval);
  for (const [, session] of sessions.entries()) {
    try { session.pty.kill(); } catch { /* ignore */ }
  }
  sessions.clear();
});
