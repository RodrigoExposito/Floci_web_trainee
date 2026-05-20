import { useState } from "react";
import { Trash2 } from "lucide-react";
import { cleanupChallenge, type CleanupResource } from "@/lib/api";

interface Props {
  trackId: string;
  challengeId: string;
  resources: CleanupResource[];
  onReset: () => void; // resets cell states + python passed in parent
}

export function CleanupButton({ trackId, challengeId, resources, onReset }: Props) {
  const [cleaning, setCleaning] = useState(false);
  const [done, setDone] = useState(false);

  async function handleCleanup() {
    if (cleaning) return;
    setCleaning(true);
    setDone(false);
    try {
      // Best-effort AWS cleanup — if Floci is down we just reset the UI
      if (resources.length > 0) {
        await cleanupChallenge(trackId, challengeId, resources).catch(() => {});
      }
    } finally {
      onReset();
      setCleaning(false);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    }
  }

  return (
    <button
      onClick={() => void handleCleanup()}
      disabled={cleaning}
      className="btn btn-ghost btn-sm flex items-center gap-1.5"
      style={{ color: done ? "var(--running)" : "var(--text-secondary)" }}
      title="Elimina los recursos AWS creados y resetea el estado del challenge"
    >
      <Trash2 className="size-3.5" />
      {cleaning ? "Limpiando…" : done ? "Listo" : "Limpiar entorno"}
    </button>
  );
}
