import { create } from "zustand";
import { apiClient } from "../services/apiClient";
import { isAbortError } from "../hooks/useCoalescedMutation";

export type ThemeMode = "SYSTEM" | "LIGHT" | "DARK";

interface ThemeState {
  theme: ThemeMode;
  isLoading: boolean;
  setTheme: (mode: ThemeMode) => void;
  loadTheme: () => Promise<void>;
}

let themeDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let themeAbortController: AbortController | null = null;
let confirmedServerTheme: ThemeMode | null = null;

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "SYSTEM",
  isLoading: true,

  setTheme: (mode: ThemeMode) => {
    set({ theme: mode });

    if (themeDebounceTimer) {
      clearTimeout(themeDebounceTimer);
    }

    themeDebounceTimer = setTimeout(async () => {
      themeDebounceTimer = null;

      if (confirmedServerTheme === mode && !themeAbortController) {
        return;
      }

      if (themeAbortController) {
        themeAbortController.abort();
      }

      const controller = new AbortController();
      themeAbortController = controller;

      try {
        await apiClient.patch(
          "/auth/preferences/",
          { theme: mode },
          { signal: controller.signal }
        );
        if (themeAbortController === controller) {
          confirmedServerTheme = mode;
          themeAbortController = null;
        }
      } catch (error) {
        const isCurrent = themeAbortController === controller;
        if (isCurrent) {
          themeAbortController = null;
        }
        if (isAbortError(error)) {
          return;
        }
        if (isCurrent && !themeDebounceTimer && confirmedServerTheme !== null) {
          set({ theme: confirmedServerTheme });
        }
      }
    }, 300);
  },

  loadTheme: async () => {
    try {
      const res = await apiClient.get("/auth/preferences/");
      const mode = (res.data.theme as ThemeMode) || "SYSTEM";
      confirmedServerTheme = mode;
      set({ theme: mode, isLoading: false });
    } catch {
      set({ theme: "SYSTEM", isLoading: false });
    }
  },
}));
