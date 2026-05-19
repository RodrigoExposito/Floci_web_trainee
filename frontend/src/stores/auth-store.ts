import { create } from "zustand";

const TOKEN_KEY = "floci-access-token";
const USERNAME_KEY = "floci-username";
const DISPLAY_NAME_KEY = "floci-display-name";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  username: string | null;
  displayName: string | null;
  loginError: string;
  loginLoading: boolean;
  initialize: () => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  username: null,
  displayName: null,
  loginError: "",
  loginLoading: false,

  initialize() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const username = sessionStorage.getItem(USERNAME_KEY);
    const displayName = sessionStorage.getItem(DISPLAY_NAME_KEY);
    set({ token, isAuthenticated: !!token, username, displayName });
  },

  async login(username: string, password: string) {
    set({ loginLoading: true, loginError: "" });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: { token: string; username: string; displayName: string };
        error?: { message: string };
      };
      if (!json.ok || !json.data?.token) {
        set({
          loginError: json.error?.message ?? "Usuario o contraseña incorrectos",
          loginLoading: false,
        });
        return false;
      }
      sessionStorage.setItem(TOKEN_KEY, json.data.token);
      sessionStorage.setItem(USERNAME_KEY, json.data.username);
      sessionStorage.setItem(DISPLAY_NAME_KEY, json.data.displayName);
      set({
        token: json.data.token,
        isAuthenticated: true,
        username: json.data.username,
        displayName: json.data.displayName,
        loginLoading: false,
        loginError: "",
      });
      return true;
    } catch {
      set({ loginError: "Error de conexión con el servidor", loginLoading: false });
      return false;
    }
  },

  logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
    sessionStorage.removeItem(DISPLAY_NAME_KEY);
    set({ token: null, isAuthenticated: false, username: null, displayName: null });
  },
}));

/** Returns the stored token for use in Authorization header */
export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}
