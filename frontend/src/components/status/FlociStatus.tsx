import { useEffect, useState } from "react";
import { checkFlociStatus } from "@/lib/api";

type Status = "unknown" | "online" | "offline";

const POLL_INTERVAL_MS = 10_000;

export function FlociStatus() {
  const [status, setStatus] = useState<Status>("unknown");

  async function checkStatus() {
    const online = await checkFlociStatus();
    setStatus(online ? "online" : "offline");
  }

  useEffect(() => {
    void checkStatus();
    const id = setInterval(() => void checkStatus(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  if (status === "unknown") return null;

  const isOnline = status === "online";

  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        background: isOnline ? "var(--accent-dim)" : "var(--danger-dim)",
        border: `1px solid ${isOnline ? "var(--accent)" : "var(--danger)"}`,
        color: isOnline ? "var(--accent)" : "var(--danger)",
      }}
    >
      <span className="relative flex size-1.5">
        {isOnline && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: "var(--accent)" }}
          />
        )}
        <span
          className="relative inline-flex size-1.5 rounded-full"
          style={{ background: isOnline ? "var(--accent)" : "var(--danger)" }}
        />
      </span>
      {isOnline ? "Floci" : "Offline"}
    </div>
  );
}
