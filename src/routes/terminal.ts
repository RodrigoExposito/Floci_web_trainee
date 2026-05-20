import type { Server, IncomingMessage } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import { verify } from "jsonwebtoken";
import {
  createShell,
  killShell,
  resizeShell,
  writeToShell,
} from "../services/shell-manager.js";

interface JwtPayload {
  userId: number;
  username: string;
  displayName: string;
}

// One active WS connection per user (enforces 1-shell-per-user)
const activeConnections = new Map<number, WebSocket>();

export function attachTerminalWs(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  // Intercept HTTP upgrade requests for our path only
  server.on("upgrade", (req: IncomingMessage, socket, head) => {
    const url = new URL(req.url ?? "", "http://localhost");

    if (url.pathname !== "/api/terminal/ws") {
      socket.destroy();
      return;
    }

    // Verify JWT passed as query param (browsers can't set WS headers)
    const token = url.searchParams.get("token");
    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    let payload: JwtPayload;
    try {
      payload = verify(token, process.env["JWT_SECRET"] ?? "") as JwtPayload;
    } catch {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, payload);
    });
  });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage, payload: JwtPayload) => {
    const { userId } = payload;

    // Close any existing connection for this user
    const existing = activeConnections.get(userId);
    if (existing && existing.readyState === 1 /* OPEN */) {
      existing.close(1000, "Replaced by new connection");
    }
    activeConnections.set(userId, ws);

    // Spawn shell with default size; will be resized immediately by client
    createShell(userId, ws);

    ws.on("message", (raw) => {
      const data = raw.toString("utf-8");
      // Resize messages arrive as JSON: { type: "resize", cols, rows }
      if (data.startsWith("{")) {
        try {
          const msg = JSON.parse(data) as { type?: string; cols?: number; rows?: number };
          if (msg.type === "resize" && msg.cols && msg.rows) {
            resizeShell(userId, msg.cols, msg.rows);
            return;
          }
        } catch { /* not JSON, fall through to shell write */ }
      }
      writeToShell(userId, data);
    });

    ws.on("close", () => {
      activeConnections.delete(userId);
      killShell(userId);
    });

    ws.on("error", (err) => {
      console.error(`[terminal] WS error for user ${userId}:`, err.message);
      activeConnections.delete(userId);
      killShell(userId);
    });
  });
}
