import { create } from "zustand";
import { colorScheme } from "nativewind";
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
    // 1. Immediately apply to NativeWind runtime
    if (mode === "SYSTEM") {
      colorScheme.set("system");
    } else if (mode === "DARK") {
      colorScheme.set("dark");
    } else {
      colorScheme.set("light");
    }

    set({ theme: mode });

    // 2. Persist to Django backend if authenticated
    try {
      await apiClient.patch("/auth/preferences/", { theme: mode });
    } catch {
      // Offline fallback: retains local theme state
    }
  },

  loadTheme: async () => {
    try {
      const res = await apiClient.get("/auth/preferences/");
      const mode = res.data.theme as ThemeMode;
      if (mode === "SYSTEM") {
        colorScheme.set("system");
      } else if (mode === "DARK") {
        colorScheme.set("dark");
      } else {
        colorScheme.set("light");
      }
      set({ theme: mode, isLoading: false });
    } catch {
      colorScheme.set("system");
      set({ theme: "SYSTEM", isLoading: false });
    }
  },
}));
