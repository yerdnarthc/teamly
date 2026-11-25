import React, { useState, useEffect } from "react";
import {
  Appearance,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  LogOut,
  Moon,
  Sun,
  Smartphone,
  Shield,
  Bell,
  GraduationCap,
  CheckCircle2,
  Share2,
  BookOpen,
  ChevronRight,
} from "lucide-react-native";
import { apiClient } from "../../src/services/apiClient";
import { useAuthStore } from "../../src/stores/authStore";
import { useThemeStore, ThemeMode } from "../../src/stores/themeStore";

interface ProfileData {
  username: string;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  bio: string;
  microsoft_account: {
    is_connected: boolean;
    teams_user_id: string;
    tenant_id: string;
    connected_at: string | null;
  };
}

interface NotificationPreferences {
  deadline_enabled: boolean;
  lead_hours: number;
  new_assignment: boolean;
}

const LEAD_HOUR_OPTIONS = [
  { hours: 2, label: "2h" },
  { hours: 12, label: "12h" },
  { hours: 24, label: "24h" },
  { hours: 48, label: "48h" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, loadTheme } = useThemeStore();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark" || theme === "DARK";

  // Local form state for academic profile
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadTheme();
  }, []);

  // 1. Fetch Academic Profile & Connected Account Details
  const { data: profile, isLoading: isProfileLoading } = useQuery<ProfileData>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await apiClient.get("/profile/");
      return res.data;
    },
  });

  // Populate local form fields when profile is fetched
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  // Mutation to update academic profile
  const profileMutation = useMutation({
    mutationFn: async (payload: { first_name: string; last_name: string; bio: string }) => {
      const res = await apiClient.patch("/profile/", payload);
      return res.data;
    },
    onSuccess: (data: ProfileData) => {
      queryClient.setQueryData(["user-profile"], data);
      setProfileSuccessMsg("Academic profile saved successfully!");
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    },
    onError: () => {
      Alert.alert("Update Failed", "Could not save your academic profile. Please try again.");
    },
  });

  // 2. Fetch Notification Preferences
  const { data: notifPrefs } = useQuery<NotificationPreferences>({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await apiClient.get("/notifications/preferences/");
      return res.data;
    },
  });

  // Mutation to update notification preferences
  const notifMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      const res = await apiClient.patch("/notifications/preferences/", updates);
      return res.data;
    },
    onSuccess: (data: NotificationPreferences) => {
      queryClient.setQueryData(["notification-preferences"], data);
      queryClient.invalidateQueries({ queryKey: ["notification-history"] });
    },
    onError: () => {
      Alert.alert("Preference Error", "Could not save notification setting.");
    },
  });

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of your student account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
            } finally {
              queryClient.clear();
              router.replace("/login");
            }
          },
        },
      ]
    );
  };

  const handleSelectTheme = (mode: ThemeMode) => {
    const syncNative = (nativeMode: "light" | "dark" | "unspecified") => {
      if (typeof Appearance.setColorScheme === "function") {
        try {
          Appearance.setColorScheme(nativeMode);
        } catch {
          // Ignore on unsupported platforms
        }
      }
    };

    if (mode === "SYSTEM") {
      setColorScheme("system");
      syncNative("unspecified");
    } else if (mode === "DARK") {
      setColorScheme("dark");
      syncNative("dark");
    } else {
      setColorScheme("light");
      syncNative("light");
    }
    setTheme(mode);
  };

  const handleSaveProfile = () => {
    profileMutation.mutate({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      bio: bio.trim(),
    });
  };

  const displayName =
    firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : profile?.username || user?.username || "Student User";

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-slate-50 dark:bg-slate-900">
      <ScrollView
        className="flex-1 px-5 pt-3"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* User Card */}
        <View className="bg-white dark:bg-slate-800 p-6 rounded-3xl mb-5 border border-slate-100 dark:border-slate-700 items-center">
          <View className="w-20 h-20 bg-brand-100 dark:bg-brand-900/50 rounded-full justify-center items-center mb-3">
            <User size={36} color={isDark ? "#60a5fa" : "#2563eb"} />
          </View>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            {displayName}
          </Text>
          <Text className="text-xs text-slate-500 mt-0.5">
            {profile?.email || user?.email || "student@school.edu"}
          </Text>
          {profile?.bio ? (
            <Text className="text-xs text-slate-600 dark:text-slate-400 text-center mt-2 px-4 leading-4">
              "{profile.bio}"
            </Text>
          ) : null}
        </View>

        {/* 1. Academic Profile Information (Editable) */}
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 mb-5">
          <View className="flex-row items-center mb-1">
            <GraduationCap size={18} color={isDark ? "#60a5fa" : "#2563eb"} />
            <Text className="text-base font-bold text-slate-900 dark:text-white ml-2">
              Academic Profile
            </Text>
          </View>
          <Text className="text-xs text-slate-500 mb-4">
            Manage your student identification details and degree notes.
          </Text>

          {profileSuccessMsg && (
            <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-950/70 p-2.5 rounded-xl mb-3 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 size={15} color="#10b981" />
              <Text className="text-xs font-medium text-emerald-800 dark:text-emerald-200 ml-2">
                {profileSuccessMsg}
              </Text>
            </View>
          )}

          {/* First & Last Name Inputs */}
          <View className="flex-row gap-2.5 mb-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                First Name
              </Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor="#94a3b8"
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Last Name
              </Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor="#94a3b8"
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </View>
          </View>

          {/* Academic Bio / Degree */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Academic Bio / Major / Year
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="e.g. BS Computer Science · Class of 2026"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={2}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white"
            />
          </View>

          {/* Save Profile Button */}
          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={profileMutation.isPending}
            className="w-full bg-brand-600 py-3 rounded-xl items-center flex-row justify-center"
          >
            {profileMutation.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-sm">Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 2. Notification & Deadline Alerts */}
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 mb-5">
          <View className="flex-row items-center mb-1">
            <Bell size={18} color={isDark ? "#60a5fa" : "#2563eb"} />
            <Text className="text-base font-bold text-slate-900 dark:text-white ml-2">
              Notification Preferences
            </Text>
          </View>
          <Text className="text-xs text-slate-500 mb-4">
            Configure how and when you receive coursework alerts.
          </Text>

          {/* Deadline Reminders Switch */}
          <View className="flex-row justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-700/60">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Deadline Reminders
              </Text>
              <Text className="text-xs text-slate-500">
                Alerts before upcoming assignment submissions
              </Text>
            </View>
            <Switch
              value={notifPrefs?.deadline_enabled ?? true}
              onValueChange={(val) => notifMutation.mutate({ deadline_enabled: val })}
              trackColor={{ false: "#cbd5e1", true: "#2563eb" }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Lead Hours Pill Selector (Shown if deadline alerts enabled) */}
          {(notifPrefs?.deadline_enabled ?? true) && (
            <View className="py-3 border-b border-slate-100 dark:border-slate-700/60">
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Reminder Lead Time
              </Text>
              <View className="flex-row gap-2">
                {LEAD_HOUR_OPTIONS.map((opt) => {
                  const isSelected = (notifPrefs?.lead_hours ?? 24) === opt.hours;
                  return (
                    <TouchableOpacity
                      key={opt.hours}
                      onPress={() => notifMutation.mutate({ lead_hours: opt.hours })}
                      className={`flex-1 py-2 rounded-xl items-center border ${
                        isSelected
                          ? "bg-brand-600 border-brand-600"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isSelected ? "text-white" : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* New Assignment Alerts Switch */}
          <View className="flex-row justify-between items-center pt-2.5 pb-3 border-b border-slate-100 dark:border-slate-700/60">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                New Assignment Alerts
              </Text>
              <Text className="text-xs text-slate-500">
                Notify when new coursework is synced from Teams
              </Text>
            </View>
            <Switch
              value={notifPrefs?.new_assignment ?? true}
              onValueChange={(val) => notifMutation.mutate({ new_assignment: val })}
              trackColor={{ false: "#cbd5e1", true: "#2563eb" }}
              thumbColor="#ffffff"
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push("/notifications/history")}
            className="pt-3 flex-row items-center justify-between"
          >
            <Text className="text-xs font-bold text-brand-600 dark:text-brand-400">
              View Scheduled Reminders & Delivery Log
            </Text>
            <ChevronRight size={16} color={isDark ? "#60a5fa" : "#2563eb"} />
          </TouchableOpacity>
        </View>

        {/* 3. 3-Way Theme Selector Card */}
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 mb-5">
          <Text className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Display Theme
          </Text>
          <Text className="text-xs text-slate-500 mb-4">
            Select your preferred visual appearance or match device system settings.
          </Text>

          {/* Segmented Controller */}
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

        {/* 4. Academic Subjects & Terms Card */}
        <TouchableOpacity
          onPress={() => router.push("/academic")}
          className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 mb-5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 justify-center items-center border border-brand-200 dark:border-brand-800 mr-3">
              <BookOpen size={18} color={isDark ? "#60a5fa" : "#2563eb"} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-900 dark:text-white">
                Subjects & Academic Terms
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                View enrolled courses, term dates, and coursework
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        {/* 5. Microsoft Teams Education Connection Card */}
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 mb-5">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Share2 size={18} color={isDark ? "#60a5fa" : "#2563eb"} />
              <Text className="text-base font-bold text-slate-900 dark:text-white ml-2">
                Microsoft Teams Education
              </Text>
            </View>
            <View
              className={`px-2 py-0.5 rounded-md ${
                profile?.microsoft_account?.is_connected
                  ? "bg-emerald-100 dark:bg-emerald-950/70"
                  : "bg-amber-100 dark:bg-amber-950/70"
              }`}
            >
              <Text
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  profile?.microsoft_account?.is_connected
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-amber-700 dark:text-amber-300"
                }`}
              >
                {profile?.microsoft_account?.is_connected ? "Connected" : "Demo Mode"}
              </Text>
            </View>
          </View>

          <Text className="text-xs text-slate-500 leading-4 mb-3.5">
            {profile?.microsoft_account?.is_connected
              ? `Linked with Tenant: ${profile.microsoft_account.tenant_id}. Sync is operational.`
              : "No live Microsoft Graph OAuth session linked. The mobile client is currently utilizing the authorized development seed for sync simulations."}
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/sync/history")}
            className="pt-3 border-t border-slate-100 dark:border-slate-700 flex-row items-center justify-between"
          >
            <Text className="text-xs font-bold text-brand-600 dark:text-brand-400">
              View Sync Diagnostics & Event Stream
            </Text>
            <ChevronRight size={16} color={isDark ? "#60a5fa" : "#2563eb"} />
          </TouchableOpacity>
        </View>

        {/* 5. Security & Hardware Keystore Info */}
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-100 dark:border-slate-700 mb-6">
          <View className="flex-row items-center p-1">
            <Shield size={18} color={isDark ? "#60a5fa" : "#2563eb"} />
            <View className="ml-3">
              <Text className="text-xs font-semibold text-slate-900 dark:text-white">
                JWT Hardware Keystore
              </Text>
              <Text className="text-[11px] text-slate-500">
                Encrypted via Expo SecureStore with automatic token refresh
              </Text>
            </View>
          </View>
        </View>

        {/* 6. Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="w-full bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl flex-row items-center justify-center border border-rose-200 dark:border-rose-900 mb-8"
        >
          <LogOut size={18} color="#e11d48" />
          <Text className="text-rose-600 font-semibold text-base ml-2">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
