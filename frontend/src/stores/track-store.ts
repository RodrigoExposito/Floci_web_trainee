import { create } from "zustand";
import { getSetting, setSetting } from "@/lib/api";

export type TrackId = "aws" | "agentes";

interface TrackStore {
  activeTrackId: TrackId;
  initialized: boolean;
  setActiveTrack: (trackId: TrackId) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useTrackStore = create<TrackStore>((set) => ({
  activeTrackId: "aws",
  initialized: false,

  async initialize() {
    try {
      const saved = await getSetting("active_track");
      if (saved === "aws" || saved === "agentes") {
        set({ activeTrackId: saved, initialized: true });
      } else {
        set({ initialized: true });
      }
    } catch {
      set({ initialized: true });
    }
  },

  async setActiveTrack(trackId) {
    set({ activeTrackId: trackId });
    try {
      await setSetting("active_track", trackId);
    } catch {
      // non-critical
    }
  },
}));
