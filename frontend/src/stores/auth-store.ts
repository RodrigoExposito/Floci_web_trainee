import { create } from "zustand";

const TOKEN_KEY = "floci-access-token";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  loginError: string;
  loginLoading: boolean;
  initialize: () => void;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  loginError: "",
  loginLoading: false,

  initialize() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    set({ token, isAuthenticated: !!token });
  },

  async login(password: string) {
    set({ loginLoading: true, loginError: "" });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: { token: string };
        error?: { message: string };
      };
      if (!json.ok || !json.data?.token) {
        set({
          loginError: json.error?.message ?? "Clave incorrecta",
          loginLoading: false,
        });
        return false;
      }
      sessionStorage.setItem(TOKEN_KEY, json.data.token);
      set({ token: json.data.token, isAuthenticated: true, loginLoading: false, loginError: "" });
      return true;
    } catch {
      set({ loginError: "Error de conexión con el servidor", loginLoading: false });
      return false;
    }
  },

  logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    set({ token: null, isAuthenticated: false });
  },
}));

/** Returns the stored token for use in Authorization header */
export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}
