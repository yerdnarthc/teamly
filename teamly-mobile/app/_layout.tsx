import "../global.css";
import React, { useEffect } from "react";
import { Appearance, View } from "react-native";
import { Stack, DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
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
    const syncNativeAppearance = (mode: "light" | "dark" | "unspecified") => {
      if (typeof Appearance.setColorScheme === "function") {
        try {
          Appearance.setColorScheme(mode);
        } catch {
          // Ignore on platforms where native override isn't supported
        }
      }
    };

    if (theme === "SYSTEM") {
      setColorScheme("system");
      syncNativeAppearance("unspecified");
    } else if (theme === "DARK") {
      setColorScheme("dark");
      syncNativeAppearance("dark");
    } else if (theme === "LIGHT") {
      setColorScheme("light");
      syncNativeAppearance("light");
    }
  }, [theme]);

  const isDark = colorScheme === "dark" || theme === "DARK";
  const bgThemeColor = isDark ? "#0f172a" : "#f8fafc";

  return (
    <View style={{ flex: 1, backgroundColor: bgThemeColor }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: bgThemeColor }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={isDark ? TeamlyDarkTheme : TeamlyLightTheme}>
            <StatusBar style={isDark ? "light" : "dark"} />
            <View style={{ flex: 1, backgroundColor: bgThemeColor }}>
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
                    backgroundColor: bgThemeColor,
                  },
                }}
              >
                <Stack.Screen
                  name="index"
                  options={{
                    contentStyle: { backgroundColor: bgThemeColor },
                  }}
                />
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                    contentStyle: { backgroundColor: bgThemeColor },
                  }}
                />
                <Stack.Screen
                  name="login"
                  options={{
                    title: "Sign In",
                    headerShown: true,
                    headerStyle: {
                      backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    },
                    headerTintColor: isDark ? "#f8fafc" : "#0f172a",
                    contentStyle: { backgroundColor: bgThemeColor },
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
                    contentStyle: { backgroundColor: bgThemeColor },
                  }}
                />
                <Stack.Screen
                  name="assignment/[id]"
                  options={{
                    headerShown: false,
                    contentStyle: { backgroundColor: bgThemeColor },
                  }}
                />
                <Stack.Screen
                  name="assignment/[id]/edit"
                  options={{
                    headerShown: false,
                    contentStyle: { backgroundColor: bgThemeColor },
                  }}
                />
                <Stack.Screen
                  name="assignment/new"
                  options={{
                    headerShown: false,
                    contentStyle: { backgroundColor: bgThemeColor },
                  }}
                />
                <Stack.Screen
                  name="modal/filter"
                  options={{
                    presentation: "transparentModal",
                    animation: "fade",
                    headerShown: false,
                    contentStyle: { backgroundColor: "transparent" },
                  }}
                />
                <Stack.Screen
                  name="academic/index"
                  options={{
                    headerShown: false,
                    contentStyle: { backgroundColor: bgThemeColor },
                  }}
                />
                <Stack.Screen
                  name="sync/history"
                  options={{
                    headerShown: false,
                    contentStyle: { backgroundColor: bgThemeColor },
                  }}
                />
                <Stack.Screen
                  name="notifications/history"
                  options={{
                    headerShown: false,
                    contentStyle: { backgroundColor: bgThemeColor },
                  }}
                />
              </Stack>
            </View>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </View>
  );
}
