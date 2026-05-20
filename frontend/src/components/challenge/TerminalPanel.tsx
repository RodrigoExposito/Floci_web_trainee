import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { getToken } from "@/stores/auth-store";
import "@xterm/xterm/css/xterm.css";

interface Props {
  active: boolean;
}

export function TerminalPanel({ active }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep refs so the cleanup closure captures the latest instances
  const termRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Resolve CSS variables to concrete colors for xterm
    const style = getComputedStyle(document.documentElement);
    const bg = style.getPropertyValue("--bg-surface").trim() || "#111113";
    const fg = style.getPropertyValue("--text-primary").trim() || "#e8e8e9";
    const accent = style.getPropertyValue("--accent").trim() || "#4ade80";

    const term = new Terminal({
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      theme: { background: bg, foreground: fg, cursor: accent, selectionBackground: "#ffffff26" },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();
    termRef.current = term;
    fitRef.current = fitAddon;

    // Build WS URL — in dev Vite proxies /api including upgrades
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const token = getToken();
    const wsUrl = `${proto}//${location.host}/api/terminal/ws${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      const dims = fitAddon.proposeDimensions();
      if (dims) ws.send(JSON.stringify({ type: "resize", cols: dims.cols, rows: dims.rows }));
    };

    ws.onmessage = (e: MessageEvent<string | ArrayBuffer>) => {
      term.write(typeof e.data === "string" ? e.data : new Uint8Array(e.data as ArrayBuffer));
    };

    ws.onclose = () => {
      term.writeln("\r\n\x1b[33m[Sesión cerrada]\x1b[0m");
    };

    ws.onerror = () => {
      term.writeln("\r\n\x1b[31m[Error de conexión]\x1b[0m");
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    // Resize the terminal whenever the container size changes
    const ro = new ResizeObserver(() => {
      fitAddon.fit();
      const dims = fitAddon.proposeDimensions();
      if (dims && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols: dims.cols, rows: dims.rows }));
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      ws.close();
      term.dispose();
      termRef.current = null;
      wsRef.current = null;
      fitRef.current = null;
    };
  }, [active]);

  return (
    <div
      ref={containerRef}
      style={{
        height: "100%",
        minHeight: 300,
        background: "var(--bg-surface)",
        borderRadius: 8,
        overflow: "hidden",
        padding: "4px 2px",
      }}
    />
  );
}
