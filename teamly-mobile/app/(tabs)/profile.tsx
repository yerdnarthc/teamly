import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { User, LogOut, Moon, Sun, Smartphone, Shield } from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useThemeStore, ThemeMode } from "../../src/stores/themeStore";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, loadTheme } = useThemeStore();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    loadTheme();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const handleSelectTheme = (mode: ThemeMode) => {
    if (mode === "SYSTEM") {
      setColorScheme("system");
    } else if (mode === "DARK") {
      setColorScheme("dark");
    } else {
      setColorScheme("light");
    }
    setTheme(mode);
  };

  return (
    <SafeAreaView edges={["top", "bottom", "left", "right"]} className="flex-1 bg-slate-50 dark:bg-slate-900">
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View className="bg-white dark:bg-slate-800 p-6 rounded-3xl mb-6 shadow-sm border border-slate-100 dark:border-slate-700 items-center">
          <View className="w-20 h-20 bg-brand-100 dark:bg-brand-900/50 rounded-full justify-center items-center mb-3">
            <User size={36} color="#2563eb" />
          </View>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            {user?.username || "Student User"}
          </Text>
          <Text className="text-sm text-slate-500 mt-0.5">
            {user?.email || "student@school.edu"}
          </Text>
        </View>

        {/* 3-Way Theme Selector Card */}
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 mb-6 shadow-sm">
          <Text className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Display Theme
          </Text>
          <Text className="text-xs text-slate-500 mb-4">
            Select your preferred visual appearance or match device system settings.
          </Text>

          {/* Segmented Controller: Explicit Pressables with static NativeWind classes */}
          <View className="flex-row bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl">
            {/* System Option */}
            <Pressable
              onPress={() => handleSelectTheme("SYSTEM")}
              className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${
                theme === "SYSTEM" ? "bg-brand-600" : ""
              }`}
            >
              <Smartphone size={16} color={theme === "SYSTEM" ? "#ffffff" : "#64748b"} />
              <Text
                className={`ml-1.5 text-xs font-semibold ${
                  theme === "SYSTEM" ? "text-white" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                System
              </Text>
            </Pressable>

            {/* Light Option */}
            <Pressable
              onPress={() => handleSelectTheme("LIGHT")}
              className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${
                theme === "LIGHT" ? "bg-brand-600" : ""
              }`}
            >
              <Sun size={16} color={theme === "LIGHT" ? "#ffffff" : "#64748b"} />
              <Text
                className={`ml-1.5 text-xs font-semibold ${
                  theme === "LIGHT" ? "text-white" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Light
              </Text>
            </Pressable>

            {/* Dark Option */}
            <Pressable
              onPress={() => handleSelectTheme("DARK")}
              className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${
                theme === "DARK" ? "bg-brand-600" : ""
              }`}
            >
              <Moon size={16} color={theme === "DARK" ? "#ffffff" : "#64748b"} />
              <Text
                className={`ml-1.5 text-xs font-semibold ${
                  theme === "DARK" ? "text-white" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Dark
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Security & Token Info */}
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-100 dark:border-slate-700 mb-8 shadow-sm">
          <View className="flex-row items-center p-2">
            <Shield size={20} color="#2563eb" />
            <View className="ml-3">
              <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                JWT Authentication
              </Text>
              <Text className="text-xs text-slate-500">
                Encrypted in hardware keystore via Expo SecureStore
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="w-full bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl flex-row items-center justify-center border border-rose-200 dark:border-rose-900 mb-12"
        >
          <LogOut size={18} color="#e11d48" />
          <Text className="text-rose-600 font-semibold text-base ml-2">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
