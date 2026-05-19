import { create } from "zustand";

type Theme = "dark" | "light";

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

function savedTheme(): Theme {
  try {
    const stored = localStorage.getItem("ft-theme") as Theme | null;
    return stored === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: savedTheme(),
  toggle() {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem("ft-theme", next);
    } catch {
      // ignore storage errors
    }
    set({ theme: next });
  },
}));

// Apply saved theme immediately on module load (before first render)
applyTheme(savedTheme());
