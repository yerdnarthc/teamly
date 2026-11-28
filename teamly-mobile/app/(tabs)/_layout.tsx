import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckSquare, Calendar, Sparkles, User } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useThemeStore } from "../../src/stores/themeStore";
import { useAuthStore } from "../../src/stores/authStore";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const isDark = colorScheme === "dark" || theme === "DARK";
  const bgThemeColor = isDark ? "#0f172a" : "#f8fafc";

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Ensure comfortable bottom padding on devices with home gestures / physical navigation bar
  const bottomPadding = Math.max(insets.bottom, 12);
  const tabHeight = 56 + bottomPadding;

  // Protect tabs from unauthenticated access
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: bgThemeColor,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: bgThemeColor }}>
      <Tabs
        screenOptions={{
          headerShown: true,
          sceneStyle: {
            backgroundColor: bgThemeColor,
          },
          headerStyle: {
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "#1e293b" : "#f1f5f9",
          },
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 18,
            color: isDark ? "#f8fafc" : "#0f172a",
          },
          headerTintColor: isDark ? "#f8fafc" : "#0f172a",
          tabBarActiveTintColor: isDark ? "#3b82f6" : "#2563eb",
          tabBarInactiveTintColor: isDark ? "#94a3b8" : "#64748b",
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginBottom: 4,
          },
          tabBarStyle: {
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
            borderTopColor: isDark ? "#1e293b" : "#e2e8f0",
            borderTopWidth: 1,
            height: tabHeight,
            paddingTop: 8,
            paddingBottom: bottomPadding,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Assignments",
            headerTitle: "My Assignments",
            tabBarIcon: ({ color, size }) => <CheckSquare size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="upcoming"
          options={{
            title: "Upcoming",
            headerTitle: "Upcoming Deadlines",
            tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="assistant"
          options={{
            title: "AI Study",
            headerTitle: "AI Assistant",
            tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerTitle: "Student Profile",
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
