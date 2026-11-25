import { create } from "zustand";
import { tokenStorage } from "../services/tokenStorage";
import { apiClient, registerUnauthorizedHandler } from "../services/apiClient";

export interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username, password) => {
    const response = await apiClient.post("/auth/token/", { username, password });
    const { access, refresh } = response.data;
    await tokenStorage.saveTokens(access, refresh);
    set({ isAuthenticated: true });
  },

  register: async (username, email, password) => {
    const response = await apiClient.post("/auth/register/", {
      username,
      email,
      password,
    });
    const { access, refresh, id } = response.data;
    await tokenStorage.saveTokens(access, refresh);
    set({
      user: { id, username, email },
      isAuthenticated: true,
    });
  },

  logout: async () => {
    const refresh = await tokenStorage.getRefreshToken();
    if (refresh) {
      try {
        await apiClient.post("/auth/token/blacklist/", { refresh });
      } catch {
        // Continue logout even if remote blacklist fails
      }
    }
    await tokenStorage.clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = await tokenStorage.getAccessToken();
    set({ isAuthenticated: !!token, isLoading: false });
  },
}));

registerUnauthorizedHandler(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false });
});
