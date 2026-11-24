import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  AlertCircle,
  ArrowRight,
} from "lucide-react-native";
import { useAuthStore } from "../src/stores/authStore";

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    setErrorMessage(null);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername) {
      setErrorMessage("Please enter a username.");
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMessage("Username must be at least 3 characters long.");
      return;
    }

    if (!cleanEmail) {
      setErrorMessage("Please enter your student email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter a password.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(cleanUsername, cleanEmail, password);
      // Auto-login succeeds, navigate to main tabs
      router.replace("/(tabs)");
    } catch (err: any) {
      const data = err.response?.data;
      if (data) {
        if (typeof data === "string") {
          setErrorMessage(data);
        } else if (data.username) {
          setErrorMessage(Array.isArray(data.username) ? data.username[0] : data.username);
        } else if (data.email) {
          setErrorMessage(Array.isArray(data.email) ? data.email[0] : data.email);
        } else if (data.password) {
          setErrorMessage(Array.isArray(data.password) ? data.password[0] : data.password);
        } else if (data.detail) {
          setErrorMessage(data.detail);
        } else {
          setErrorMessage("Registration failed. Please check your information and try again.");
        }
      } else {
        setErrorMessage("Unable to connect to the server. Please check your network connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white dark:bg-slate-900"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand / Header Section */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 justify-center items-center mb-3 border border-brand-500/20">
            <GraduationCap size={32} color="#2563eb" />
          </View>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white text-center">
            Create Student Account
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center">
            Join Teamly to sync your assignments and track academic deadlines
          </Text>
        </View>

        {/* Error Feedback Banner */}
        {errorMessage && (
          <View className="flex-row items-center bg-rose-50 dark:bg-rose-950/60 p-3.5 rounded-2xl mb-5 border border-rose-200 dark:border-rose-900">
            <AlertCircle size={18} color="#e11d48" />
            <Text className="text-xs font-medium text-rose-800 dark:text-rose-200 ml-2.5 flex-1">
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Registration Form */}
        <View className="space-y-4">
          {/* Username Field */}
          <View className="mb-4">
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Username *
            </Text>
            <View className="flex-row items-center border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 bg-slate-50 dark:bg-slate-800">
              <User size={18} color={isDark ? "#94a3b8" : "#64748b"} />
              <TextInput
                value={username}
                onChangeText={(val) => {
                  setUsername(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="e.g. jdoe2026"
                placeholderTextColor="#94a3b8"
                className="flex-1 py-3 px-2.5 text-base text-slate-900 dark:text-white"
              />
            </View>
          </View>

          {/* Email Field */}
          <View className="mb-4">
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Student Email *
            </Text>
            <View className="flex-row items-center border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 bg-slate-50 dark:bg-slate-800">
              <Mail size={18} color={isDark ? "#94a3b8" : "#64748b"} />
              <TextInput
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                placeholder="student@university.edu"
                placeholderTextColor="#94a3b8"
                className="flex-1 py-3 px-2.5 text-base text-slate-900 dark:text-white"
              />
            </View>
          </View>

          {/* Password Field */}
          <View className="mb-4">
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Password (min. 8 characters) *
            </Text>
            <View className="flex-row items-center border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 bg-slate-50 dark:bg-slate-800">
              <Lock size={18} color={isDark ? "#94a3b8" : "#64748b"} />
              <TextInput
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                secureTextEntry={!showPassword}
                placeholder="At least 8 characters"
                placeholderTextColor="#94a3b8"
                className="flex-1 py-3 px-2.5 text-base text-slate-900 dark:text-white"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#94a3b8" />
                ) : (
                  <Eye size={18} color="#94a3b8" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Field */}
          <View className="mb-6">
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm Password *
            </Text>
            <View className="flex-row items-center border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 bg-slate-50 dark:bg-slate-800">
              <Lock size={18} color={isDark ? "#94a3b8" : "#64748b"} />
              <TextInput
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                secureTextEntry={!showConfirmPassword}
                placeholder="Re-enter password"
                placeholderTextColor="#94a3b8"
                className="flex-1 py-3 px-2.5 text-base text-slate-900 dark:text-white"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} color="#94a3b8" />
                ) : (
                  <Eye size={18} color="#94a3b8" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Action Button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className="w-full bg-brand-600 py-4 rounded-xl items-center flex-row justify-center shadow-sm"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text className="text-white font-semibold text-base mr-2">
                  Create Account
                </Text>
                <ArrowRight size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Navigation to Sign In */}
        <View className="flex-row justify-center items-center mt-8">
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text className="text-sm font-bold text-brand-600 dark:text-brand-400">
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
