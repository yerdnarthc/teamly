import "../global.css";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
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

const TeamlyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#3b82f6",
    background: "#0f172a",
    card: "#0f172a",
    text: "#f8fafc",
    border: "#1e293b",
    notification: "#ef4444",
  },
};

const TeamlyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#2563eb",
    background: "#f8fafc",
    card: "#ffffff",
    text: "#0f172a",
    border: "#f1f5f9",
    notification: "#ef4444",
  },
};

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

  const isDark = colorScheme === "dark" || theme === "DARK";

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={isDark ? TeamlyDarkTheme : TeamlyLightTheme}>
          <StatusBar style={isDark ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerShown: false,
              headerStyle: {
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
              },
              headerTintColor: isDark ? "#f8fafc" : "#0f172a",
              headerTitleStyle: {
                fontWeight: "700",
                color: isDark ? "#f8fafc" : "#0f172a",
              },
              contentStyle: {
                backgroundColor: isDark ? "#0f172a" : "#f8fafc",
              },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="login"
              options={{
                title: "Sign In",
                headerShown: true,
                headerStyle: {
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                },
                headerTintColor: isDark ? "#f8fafc" : "#0f172a",
              }}
            />
            <Stack.Screen
              name="register"
              options={{
                title: "Create Account",
                headerShown: true,
                headerStyle: {
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                },
                headerTintColor: isDark ? "#f8fafc" : "#0f172a",
              }}
            />
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
