import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { User, LogOut, Moon, Sun, Shield } from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-6">
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

      <View className="bg-white dark:bg-slate-800 rounded-2xl p-2 border border-slate-100 dark:border-slate-700 mb-6">
        <View className="flex-row items-center p-3 border-b border-slate-100 dark:border-slate-700">
          <Shield size={20} color="#64748b" />
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-3">
            JWT Session Token
          </Text>
          <Text className="text-xs text-green-600 font-semibold ml-auto">Encrypted (Hardware Keystore)</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        className="w-full bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl flex-row items-center justify-center border border-rose-200 dark:border-rose-900 active:bg-rose-100"
      >
        <LogOut size={18} color="#e11d48" />
        <Text className="text-rose-600 font-semibold text-base ml-2">Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}
