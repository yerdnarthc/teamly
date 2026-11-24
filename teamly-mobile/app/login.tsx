import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../src/stores/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert("Validation", "Please enter both username and password.");
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      router.replace("/");
    } catch (err: any) {
      Alert.alert(
        "Login Failed",
        err.response?.data?.detail || "Invalid credentials or unable to reach backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-900 px-6 justify-center">
      <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Student Sign In</Text>
      <Text className="text-slate-500 dark:text-slate-400 mb-8">Access your synced Teams assignments</Text>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
            placeholder="Enter username"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View className="mt-4">
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
            placeholder="Enter password"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className="w-full bg-brand-600 py-4 rounded-xl items-center mt-6 shadow-sm active:bg-brand-700"
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-semibold text-base">Sign In with JWT</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
