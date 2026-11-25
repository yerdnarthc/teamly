import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useColorScheme } from "nativewind";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronRight,
  GraduationCap,
  Layers,
} from "lucide-react-native";
import { apiClient } from "../../src/services/apiClient";
import { useAssignmentFilterStore } from "../../src/stores/assignmentFilterStore";
import { useThemeStore } from "../../src/stores/themeStore";

interface AcademicTermItem {
  id: number;
  name: string;
  starts_on: string;
  ends_on: string;
  is_active: boolean;
  subject_count?: number;
}

interface SubjectDetailItem {
  id: number;
  name: string;
  color: string;
  teams_group_id: string;
  term: AcademicTermItem;
  assignment_count: number;
  active_assignment_count: number;
}

function formatShortDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AcademicSubjectsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const isDark = colorScheme === "dark" || theme === "DARK";

  const setFilters = useAssignmentFilterStore((state) => state.setFilters);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);

  const {
    data: terms,
    isLoading: loadingTerms,
    isRefetching: refetchingTerms,
    refetch: refetchTerms,
  } = useQuery<AcademicTermItem[]>({
    queryKey: ["academic-terms"],
    queryFn: async () => {
      const res = await apiClient.get("/academic/terms/");
      return res.data;
    },
  });

  const {
    data: subjects,
    isLoading: loadingSubjects,
    isRefetching: refetchingSubjects,
    refetch: refetchSubjects,
  } = useQuery<SubjectDetailItem[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await apiClient.get("/academic/subjects/");
      return res.data;
    },
  });

  const isLoading = loadingTerms || loadingSubjects;
  const isRefreshing = refetchingTerms || refetchingSubjects;

  const handleRefresh = async () => {
    await Promise.all([refetchTerms(), refetchSubjects()]);
  };

  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    if (selectedTermId === null) return subjects;
    return subjects.filter((s) => s.term?.id === selectedTermId);
  }, [subjects, selectedTermId]);

  const handleOpenCourseAssignments = (subjectId: number) => {
    setFilters({
      statusCode: null,
      priorityCode: null,
      subjectId,
    });
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      className="flex-1 bg-slate-50 dark:bg-slate-900"
    >
      {/* Header Bar */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3 border-b border-slate-200/70 dark:border-slate-800">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 justify-center items-center border border-slate-200 dark:border-slate-700 mr-3"
          >
            <ArrowLeft size={18} color={isDark ? "#f8fafc" : "#0f172a"} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              Subjects & Terms
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              {subjects?.length || 0} enrolled courses
            </Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-sm text-slate-500 dark:text-slate-400 mt-3">
            Loading academic catalog...
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Academic Terms Section */}
          {terms && terms.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Calendar size={16} color={isDark ? "#60a5fa" : "#2563eb"} />
                  <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1.5">
                    Academic Terms
                  </Text>
                </View>
                {selectedTermId !== null && (
                  <TouchableOpacity onPress={() => setSelectedTermId(null)}>
                    <Text className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                      Show all terms
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {terms.map((term) => {
                const isSelected = selectedTermId === term.id;
                return (
                  <TouchableOpacity
                    key={term.id}
                    onPress={() =>
                      setSelectedTermId(isSelected ? null : term.id)
                    }
                    className={`p-4 rounded-3xl mb-2.5 border ${
                      isSelected
                        ? "bg-brand-50 dark:bg-brand-950/60 border-brand-500 dark:border-brand-500"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View className="flex-row items-center flex-1 mr-2">
                        <GraduationCap
                          size={18}
                          color={isDark ? "#60a5fa" : "#2563eb"}
                        />
                        <Text className="text-base font-bold text-slate-900 dark:text-white ml-2">
                          {term.name}
                        </Text>
                      </View>

                      <View
                        className={`px-2.5 py-0.5 rounded-full ${
                          term.is_active
                            ? "bg-emerald-100 dark:bg-emerald-950/70"
                            : "bg-slate-100 dark:bg-slate-700"
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-bold uppercase tracking-wider ${
                            term.is_active
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {term.is_active ? "Active" : "Archived"}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between mt-1">
                      <Text className="text-xs text-slate-500 dark:text-slate-400">
                        {formatShortDate(term.starts_on)} – {formatShortDate(term.ends_on)}
                      </Text>
                      <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {term.subject_count ?? 0}{" "}
                        {(term.subject_count ?? 0) === 1 ? "course" : "courses"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Enrolled Subjects Section */}
          <View className="flex-row items-center mb-3">
            <Layers size={16} color={isDark ? "#60a5fa" : "#2563eb"} />
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1.5">
              Enrolled Subjects ({filteredSubjects.length})
            </Text>
          </View>

          {filteredSubjects.length > 0 ? (
            filteredSubjects.map((subject) => {
              const accentColor = subject.color || "#3b82f6";
              return (
                <TouchableOpacity
                  key={subject.id}
                  onPress={() => handleOpenCourseAssignments(subject.id)}
                  className="bg-white dark:bg-slate-800 rounded-3xl p-4 mb-3 border border-slate-200 dark:border-slate-700 flex-row items-center"
                >
                  {/* Color Accent Pill */}
                  <View
                    className="w-2 self-stretch rounded-full mr-3.5"
                    style={{ backgroundColor: accentColor }}
                  />

                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <View
                        className="w-2.5 h-2.5 rounded-full mr-2"
                        style={{ backgroundColor: accentColor }}
                      />
                      <Text
                        className="text-base font-bold text-slate-900 dark:text-white flex-1"
                        numberOfLines={1}
                      >
                        {subject.name}
                      </Text>
                    </View>

                    <Text className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                      {subject.term?.name || "Current Term"}
                    </Text>

                    <View className="flex-row items-center gap-2">
                      <View className="bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                        <Text className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                          {subject.active_assignment_count} active
                        </Text>
                      </View>
                      <View className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
                        <Text className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                          {subject.assignment_count} total
                        </Text>
                      </View>
                    </View>
                  </View>

                  <ChevronRight size={18} color="#94a3b8" />
                </TouchableOpacity>
              );
            })
          ) : (
            <View className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 items-center">
              <BookOpen size={40} color="#94a3b8" />
              <Text className="text-base font-bold text-slate-800 dark:text-slate-200 mt-3 text-center">
                No enrolled subjects found
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1 leading-5">
                Your synced Microsoft Teams courses and academic terms will appear here.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
