import { create } from "zustand";
import { apiClient } from "../services/apiClient";

export type ThemeMode = "SYSTEM" | "LIGHT" | "DARK";

interface ThemeState {
  theme: ThemeMode;
  isLoading: boolean;
  setTheme: (mode: ThemeMode) => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "SYSTEM",
  isLoading: true,

  setTheme: async (mode: ThemeMode) => {
    set({ theme: mode });

    // Persist to Django backend if authenticated
    try {
      await apiClient.patch("/auth/preferences/", { theme: mode });
    } catch {
      // Offline fallback: retains local theme state
    }
  },

  loadTheme: async () => {
    try {
      const res = await apiClient.get("/auth/preferences/");
      const mode = (res.data.theme as ThemeMode) || "SYSTEM";
      set({ theme: mode, isLoading: false });
    } catch {
      set({ theme: "SYSTEM", isLoading: false });
    }
  },
}));
