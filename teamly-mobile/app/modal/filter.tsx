import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useColorScheme } from "nativewind";
import { X, Check, RotateCcw } from "lucide-react-native";
import { apiClient } from "../../src/services/apiClient";
import { useAssignmentFilterStore } from "../../src/stores/assignmentFilterStore";
import { useThemeStore } from "../../src/stores/themeStore";

interface SubjectOption {
  id: number;
  name: string;
  color: string;
}

const STATUS_OPTIONS = [
  { code: null, label: "All Statuses" },
  { code: "NOT_STARTED", label: "Not Started" },
  { code: "IN_PROGRESS", label: "In Progress" },
  { code: "COMPLETED", label: "Completed" },
];

const PRIORITY_OPTIONS = [
  { code: null, label: "All Priorities" },
  { code: "LOW", label: "Low" },
  { code: "MEDIUM", label: "Medium" },
  { code: "HIGH", label: "High" },
  { code: "URGENT", label: "Urgent" },
];

export default function FilterBottomSheetModal() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const isDark = colorScheme === "dark" || theme === "DARK";

  const { statusCode, priorityCode, subjectId, setFilters } =
    useAssignmentFilterStore();

  const [draftStatus, setDraftStatus] = useState<string | null>(statusCode);
  const [draftPriority, setDraftPriority] = useState<string | null>(priorityCode);
  const [draftSubjectId, setDraftSubjectId] = useState<number | null>(subjectId);

  const { data: subjects, isLoading: loadingSubjects } = useQuery<SubjectOption[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await apiClient.get("/academic/subjects/");
      return res.data;
    },
  });

  const handleReset = () => {
    setDraftStatus(null);
    setDraftPriority(null);
    setDraftSubjectId(null);
  };

  const handleApply = () => {
    setFilters({
      statusCode: draftStatus,
      priorityCode: draftPriority,
      subjectId: draftSubjectId,
    });
    router.back();
  };

  const activeDraftCount =
    (draftStatus ? 1 : 0) + (draftPriority ? 1 : 0) + (draftSubjectId ? 1 : 0);

  return (
    <View className="flex-1 justify-end bg-black/50">
      {/* Backdrop tap to dismiss */}
      <Pressable className="flex-1" onPress={() => router.back()} />

      {/* Bottom Sheet Panel */}
      <View className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 max-h-[82%]">
        <SafeAreaView edges={["bottom", "left", "right"]} className="w-full max-h-full">
          {/* Drag Handle */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center">
              <Text className="text-lg font-bold text-slate-900 dark:text-white">
                Filter Assignments
              </Text>
              {activeDraftCount > 0 && (
                <View className="ml-2 px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800">
                  <Text className="text-xs font-bold text-brand-700 dark:text-brand-300">
                    {activeDraftCount}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={handleReset}
                accessibilityLabel="Reset filters"
                className="flex-row items-center px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800"
              >
                <RotateCcw size={14} color={isDark ? "#cbd5e1" : "#475569"} />
                <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1.5">
                  Reset
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.back()}
                accessibilityLabel="Close filter modal"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 justify-center items-center"
              >
                <X size={18} color={isDark ? "#f8fafc" : "#0f172a"} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            className="px-5 pt-4 flex-shrink"
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Status Section */}
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Progress Status
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = draftStatus === opt.code;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    onPress={() => setDraftStatus(opt.code)}
                    className={`px-3.5 py-2.5 rounded-2xl border ${
                      isSelected
                        ? "bg-brand-600 border-brand-600"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected
                          ? "text-white"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Priority Section */}
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Priority Level
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {PRIORITY_OPTIONS.map((opt) => {
                const isSelected = draftPriority === opt.code;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    onPress={() => setDraftPriority(opt.code)}
                    className={`px-3.5 py-2.5 rounded-2xl border ${
                      isSelected
                        ? "bg-brand-600 border-brand-600"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected
                          ? "text-white"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Subject Section */}
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Subject / Course
            </Text>
            {loadingSubjects ? (
              <ActivityIndicator size="small" color="#2563eb" className="my-3" />
            ) : (
              <View className="flex-row flex-wrap gap-2 mb-4">
                <TouchableOpacity
                  onPress={() => setDraftSubjectId(null)}
                  className={`px-3.5 py-2.5 rounded-2xl border ${
                    draftSubjectId === null
                      ? "bg-brand-600 border-brand-600"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      draftSubjectId === null
                        ? "text-white"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    All Courses
                  </Text>
                </TouchableOpacity>

                {subjects?.map((sub) => {
                  const isSelected = draftSubjectId === sub.id;
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      onPress={() => setDraftSubjectId(sub.id)}
                      className={`px-3.5 py-2.5 rounded-2xl border flex-row items-center ${
                        isSelected
                          ? "bg-brand-600 border-brand-600"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <View
                        className="w-2.5 h-2.5 rounded-full mr-2"
                        style={{ backgroundColor: sub.color || "#3b82f6" }}
                      />
                      <Text
                        className={`text-xs font-semibold ${
                          isSelected
                            ? "text-white"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {sub.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Apply CTA */}
          <View className="px-5 pt-3 pb-4 border-t border-slate-100 dark:border-slate-800">
            <TouchableOpacity
              onPress={handleApply}
              className="w-full bg-brand-600 py-4 rounded-2xl flex-row items-center justify-center"
            >
              <Check size={18} color="#ffffff" />
              <Text className="text-white font-bold text-base ml-2">
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}
