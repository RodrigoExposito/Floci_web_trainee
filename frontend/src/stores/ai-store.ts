import { create } from "zustand";
import { callAi } from "@/lib/api";
import { useTrackStore } from "@/stores/track-store";

export type AiContextType = "dashboard" | "lesson" | "challenge";

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ChallengeAiContext {
  objective: string;
  attemptCount: number;
  lastValidationResults: string;
}

interface AiStore {
  open: boolean;
  messages: AiMessage[];
  loading: boolean;
  contextType: AiContextType;
  context: string;
  challengeContext: ChallengeAiContext | null;

  toggle: () => void;
  setOpen: (open: boolean) => void;
  setContext: (type: AiContextType, context: string) => void;
  setChallengeContext: (ctx: ChallengeAiContext | null) => void;
  clearMessages: () => void;
  sendMessage: (prompt: string) => Promise<void>;
}

function formatError(err: string): string {
  if (err.includes("RATE_LIMIT") || err.includes("RATE_LIMITED"))
    return "⚠️ Límite de consultas alcanzado. Esperá unos minutos.";
  if (err.includes("HTTP_ERROR") || err.includes("Error de conexión"))
    return "⚠️ Error de conexión. Verificá tu internet.";
  if (err.includes("tardó demasiado") || err.includes("TIMEOUT"))
    return "⚠️ La consulta tardó demasiado. Intentá de nuevo.";
  return `⚠️ ${err}`;
}

export const useAiStore = create<AiStore>((set, get) => ({
  open: false,
  messages: [],
  loading: false,
  contextType: "dashboard",
  context: "El estudiante está en el dashboard.",
  challengeContext: null,

  toggle() {
    set((s) => ({ open: !s.open }));
  },

  setOpen(open) {
    set({ open });
  },

  setContext(type, context) {
    const prev = get();
    const changed = prev.contextType !== type || prev.context !== context;
    set({ contextType: type, context, ...(changed ? { messages: [] } : {}) });
  },

  setChallengeContext(ctx) {
    set({ challengeContext: ctx });
  },

  clearMessages() {
    set({ messages: [] });
  },

  async sendMessage(prompt) {
    if (get().loading) return;
    const userMsg: AiMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
    };
    set((s) => ({ messages: [...s.messages, userMsg], loading: true }));

    try {
      const response = await callAi(
        prompt,
        get().context,
        useTrackStore.getState().activeTrackId
      );
      const assistantMsg: AiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
      };
      set((s) => ({ messages: [...s.messages, assistantMsg], loading: false }));
    } catch (err) {
      const errMsg: AiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: formatError(String(err)),
      };
      set((s) => ({ messages: [...s.messages, errMsg], loading: false }));
    }
  },
}));
