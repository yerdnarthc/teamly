import "../global.css";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useAuthStore } from "../src/stores/authStore";
import { useThemeStore } from "../src/stores/themeStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    },
  },
});

export default function RootLayout() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const theme = useThemeStore((state) => state.theme);
  const loadTheme = useThemeStore((state) => state.loadTheme);
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    checkAuth();
    loadTheme();
  }, []);

  useEffect(() => {
    if (theme === "SYSTEM") {
      setColorScheme("system");
    } else if (theme === "DARK") {
      setColorScheme("dark");
    } else if (theme === "LIGHT") {
      setColorScheme("light");
    }
  }, [theme]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: "Login", headerShown: true }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
