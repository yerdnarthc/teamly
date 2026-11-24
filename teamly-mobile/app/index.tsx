import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BookOpen, Sparkles, CheckCircle2 } from "lucide-react-native";
import { useAuthStore } from "../src/stores/authStore";

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, logout } = useAuthStore();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      className="flex-1 bg-slate-50 dark:bg-slate-900"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-16 h-16 bg-brand-500 rounded-2xl justify-center items-center mb-6 shadow-md shadow-blue-500/20">
          <Sparkles size={32} color="#ffffff" />
        </View>

        <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-center">
          Welcome to Teamly
        </Text>
        <Text className="text-base text-slate-500 dark:text-slate-400 mb-8 text-center max-w-xs">
          Your AI-powered academic assignment assistant. Synchronize from Teams, track subtasks, and meet your deadlines.
        </Text>

        <View className="w-full space-y-4 max-w-sm">
          {isAuthenticated ? (
            <>
              <View className="flex-row items-center justify-center p-3.5 bg-green-50 dark:bg-green-950/40 rounded-2xl mb-4 border border-green-200 dark:border-green-800">
                <CheckCircle2 size={18} color="#16a34a" />
                <Text className="text-green-700 dark:text-green-300 font-medium ml-2">
                  Signed in securely with JWT
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push("/(tabs)")}
                className="w-full bg-brand-600 py-4 rounded-2xl items-center shadow-sm mb-2.5"
              >
                <Text className="text-white font-semibold text-lg">Go to Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  logout();
                  queryClient.clear();
                }}
                className="w-full bg-slate-200 dark:bg-slate-800 py-3.5 rounded-2xl items-center"
              >
                <Text className="text-slate-700 dark:text-slate-200 font-medium">Log out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => router.push("/login")}
                className="w-full bg-brand-600 py-4 rounded-2xl items-center shadow-sm mb-3"
              >
                <Text className="text-white font-semibold text-lg">Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/register")}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-3.5 rounded-2xl items-center mb-3 shadow-sm"
              >
                <Text className="text-slate-800 dark:text-slate-100 font-semibold text-base">
                  Create Student Account
                </Text>
              </TouchableOpacity>

              <View className="flex-row justify-center items-center mt-4">
                <BookOpen size={16} color="#64748b" />
                <Text className="text-sm text-slate-500 dark:text-slate-400 ml-1.5">
                  Connected to Django Headless REST API
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
