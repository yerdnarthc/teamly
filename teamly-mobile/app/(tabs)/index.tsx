import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { useColorScheme } from "nativewind";
import {
  BookOpen,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import { apiClient } from "../../src/services/apiClient";
import { useAssignmentFilterStore } from "../../src/stores/assignmentFilterStore";
import { useThemeStore } from "../../src/stores/themeStore";
import { STATUS_LABELS, PRIORITY_LABELS } from "../../src/constants/assignmentLabels";

export interface AssignmentListItem {
  id: number;
  title: string;
  due_at: string | null;
  source: string;
  status: { id: number; code: string; label: string };
  priority: { id: number; code: string; rank: number };
  subject: { id: number; name: string; color: string; teams_group_id: string } | null;
  subtask_count: number;
  completed_subtask_count: number;
}

interface SyncReport {
  created_count: number;
  updated_count: number;
  unchanged_count: number;
  events_emitted: number;
  message: string;
}

interface SubjectOption {
  id: number;
  name: string;
  color: string;
}

const SORT_LABELS: Record<string, string> = {
  due_desc: "Due Latest",
  priority: "Priority",
  subject: "Subject",
  status: "Status",
};

export default function AssignmentsFeedScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colorScheme } = useColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const isDark = colorScheme === "dark" || theme === "DARK";

  const [syncToast, setSyncToast] = useState<string | null>(null);
  const {
    searchQuery,
    statusCode,
    priorityCode,
    subjectId,
    sortBy,
    setSearchQuery,
    setFilters,
    resetAll,
  } = useAssignmentFilterStore();

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const activeFilterCount =
    (statusCode ? 1 : 0) +
    (priorityCode ? 1 : 0) +
    (subjectId ? 1 : 0) +
    (sortBy !== "due_asc" ? 1 : 0);
  const hasAnyFilterOrSearch = activeFilterCount > 0 || debouncedSearch.length > 0;

  const { data: subjects } = useQuery<SubjectOption[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await apiClient.get("/academic/subjects/");
      return res.data;
    },
  });

  const activeSubjectName = subjects?.find((s) => s.id === subjectId)?.name;

  const {
    data: assignments,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<AssignmentListItem[]>({
    queryKey: ["assignments", debouncedSearch, statusCode, priorityCode, subjectId, sortBy],
    queryFn: async ({ signal }) => {
      const params: Record<string, string | number> = {};
      if (debouncedSearch) params.q = debouncedSearch;
      if (statusCode) params.status = statusCode;
      if (priorityCode) params.priority = priorityCode;
      if (subjectId) params.subject = subjectId;
      if (sortBy && sortBy !== "due_asc") params.sort = sortBy;

      const res = await apiClient.get("/assignments/", { params, signal });
      return res.data;
    },
  });

  // Sync Mutation: Calls POST /api/v1/sync/teams/
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<SyncReport>("/sync/teams/");
      return res.data;
    },
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["workload-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["academic-terms"] });
      queryClient.invalidateQueries({ queryKey: ["ai-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["sync-history"] });
      setSyncToast(report.message);
      setTimeout(() => setSyncToast(null), 5000);
    },
    onError: (err: any) => {
      Alert.alert(
        "Sync Failed",
        err.response?.data?.detail || "Could not retrieve Teams assignments."
      );
    },
  });

  const renderItem = ({ item }: { item: AssignmentListItem }) => {
    const isCompleted = item.status.code === "COMPLETED";
    const isHighOrUrgent =
      item.priority.code === "HIGH" || item.priority.code === "URGENT";
    const subjectColor = item.subject?.color || "#3b82f6";

    return (
      <TouchableOpacity
        onPress={() => router.push(`/assignment/${item.id}`)}
        className="bg-white dark:bg-slate-800 p-4 rounded-none mb-3 border border-slate-100 dark:border-slate-700"
      >
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-1 mr-2">
            {item.subject ? (
              <View
                className="px-2.5 py-1 rounded-none flex-row items-center self-start max-w-full"
                style={{ backgroundColor: `${subjectColor}15` }}
              >
                <View
                  className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
                  style={{ backgroundColor: subjectColor }}
                />
                <Text
                  className="text-xs font-semibold flex-shrink"
                  style={{ color: subjectColor }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.subject.name}
                </Text>
              </View>
            ) : (
              <View className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-none self-start">
                <Text className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  General
                </Text>
              </View>
            )}
          </View>

          <View
            className={`px-2.5 py-0.5 rounded-none flex-shrink-0 ${
              isCompleted
                ? "bg-green-100 dark:bg-green-950/60"
                : isHighOrUrgent
                ? "bg-rose-100 dark:bg-rose-950/60"
                : "bg-amber-100 dark:bg-amber-950/60"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                isCompleted
                  ? "text-green-700 dark:text-green-300"
                  : isHighOrUrgent
                  ? "text-rose-700 dark:text-rose-300"
                  : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {item.status.label}
            </Text>
          </View>
        </View>

        <Text className="text-base font-bold text-slate-900 dark:text-white mb-2" numberOfLines={2}>
          {item.title}
        </Text>

        <View className="flex-row items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-700/50">
          <View className="flex-row items-center">
            <Clock size={14} color="#64748b" />
            <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1">
              {item.due_at ? new Date(item.due_at).toLocaleDateString() : "No deadline"}
            </Text>
          </View>

          <View className="flex-row items-center">
            <CheckCircle size={14} color="#3b82f6" />
            <Text className="text-xs text-slate-600 dark:text-slate-300 font-medium ml-1">
              {item.completed_subtask_count}/{item.subtask_count} subtasks
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 px-4 pt-3">
      {/* Search & Filter Controls */}
      <View className="flex-row items-center gap-2.5 mb-3">
        <View className="flex-1 flex-row items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none px-3.5">
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search assignments or courses..."
            placeholderTextColor="#94a3b8"
            returnKeyType="search"
            className="flex-1 py-2.5 px-2.5 text-sm text-slate-900 dark:text-white"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              accessibilityLabel="Clear search"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.push("/modal/filter")}
          accessibilityLabel="Open filters"
          className={`flex-row items-center justify-center h-11 px-3.5 rounded-none border ${
            activeFilterCount > 0
              ? "bg-brand-600 border-brand-600"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          }`}
        >
          <SlidersHorizontal
            size={16}
            color={activeFilterCount > 0 ? "#ffffff" : isDark ? "#cbd5e1" : "#475569"}
          />
          {activeFilterCount > 0 && (
            <View className="ml-1.5 px-1.5 py-0.5 rounded-none bg-white/20">
              <Text className="text-[11px] font-bold text-white">
                {activeFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filter Chips Strip */}
      {activeFilterCount > 0 && (
        <View className="flex-row flex-wrap items-center gap-2 mb-3">
          {statusCode && (
            <TouchableOpacity
              onPress={() =>
                setFilters({ statusCode: null, priorityCode, subjectId })
              }
              className="flex-row items-center bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-none border border-brand-200 dark:border-brand-800"
            >
              <Text className="text-xs font-semibold text-brand-700 dark:text-brand-300 mr-1">
                {STATUS_LABELS[statusCode] || statusCode}
              </Text>
              <X size={12} color={isDark ? "#93c5fd" : "#1d4ed8"} />
            </TouchableOpacity>
          )}

          {priorityCode && (
            <TouchableOpacity
              onPress={() =>
                setFilters({ statusCode, priorityCode: null, subjectId })
              }
              className="flex-row items-center bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-none border border-brand-200 dark:border-brand-800"
            >
              <Text className="text-xs font-semibold text-brand-700 dark:text-brand-300 mr-1">
                {PRIORITY_LABELS[priorityCode] || priorityCode} Priority
              </Text>
              <X size={12} color={isDark ? "#93c5fd" : "#1d4ed8"} />
            </TouchableOpacity>
          )}

          {subjectId && (
            <TouchableOpacity
              onPress={() =>
                setFilters({ statusCode, priorityCode, subjectId: null })
              }
              className="flex-row items-center bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-none border border-brand-200 dark:border-brand-800"
            >
              <Text className="text-xs font-semibold text-brand-700 dark:text-brand-300 mr-1">
                {activeSubjectName || "Course"}
              </Text>
              <X size={12} color={isDark ? "#93c5fd" : "#1d4ed8"} />
            </TouchableOpacity>
          )}

          {sortBy !== "due_asc" && (
            <TouchableOpacity
              onPress={() =>
                setFilters({ statusCode, priorityCode, subjectId, sortBy: "due_asc" })
              }
              className="flex-row items-center bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-none border border-brand-200 dark:border-brand-800"
            >
              <Text className="text-xs font-semibold text-brand-700 dark:text-brand-300 mr-1">
                Sort: {SORT_LABELS[sortBy] || sortBy}
              </Text>
              <X size={12} color={isDark ? "#93c5fd" : "#1d4ed8"} />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={resetAll} className="px-2 py-1">
            <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Clear all
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Top Action Bar with Courses & Sync from Teams Buttons */}
      <View className="flex-row items-center justify-between mb-3 px-1">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {assignments?.length || 0} {hasAnyFilterOrSearch ? "Matching" : "Assignments"}
        </Text>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => router.push("/academic")}
            accessibilityLabel="View enrolled courses and terms"
            className="flex-row items-center bg-white dark:bg-slate-800 px-3 py-2 rounded-none border border-slate-200 dark:border-slate-700"
          >
            <BookOpen size={14} color={isDark ? "#cbd5e1" : "#475569"} />
            <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200 ml-1.5">
              Courses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!syncMutation.isPending) syncMutation.mutate();
            }}
            disabled={syncMutation.isPending}
            className="flex-row items-center bg-brand-50 dark:bg-brand-950/60 px-3.5 py-2 rounded-none border border-brand-200 dark:border-brand-800"
          >
            {syncMutation.isPending ? (
              <ActivityIndicator size="small" color={isDark ? "#93c5fd" : "#2563eb"} />
            ) : (
              <RefreshCw size={14} color={isDark ? "#93c5fd" : "#2563eb"} />
            )}
            <Text className="text-xs font-semibold text-brand-700 dark:text-brand-300 ml-1.5">
              {syncMutation.isPending ? "Syncing..." : "Sync from Teams"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sync Toast Feedback Banner */}
      {syncToast && (
        <View className="flex-row items-center bg-green-50 dark:bg-green-950/70 p-3 rounded-none mb-3 border border-green-200 dark:border-green-800">
          <CheckCircle2 size={18} color="#16a34a" />
          <Text className="text-xs font-medium text-green-800 dark:text-green-200 ml-2 flex-1">
            {syncToast}
          </Text>
        </View>
      )}

      {/* Assignment List / Loading / Empty States */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center pb-20">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-slate-500 dark:text-slate-400 mt-3 text-sm">
            Loading assignments...
          </Text>
        </View>
      ) : assignments && assignments.length > 0 ? (
        <FlashList
          data={assignments}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
            />
          }
          contentContainerStyle={{ paddingBottom: 96 }}
        />
      ) : hasAnyFilterOrSearch ? (
        <View className="flex-1 justify-center items-center px-6 pb-20">
          <Search size={44} color="#94a3b8" />
          <Text className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-4 text-center">
            No matching assignments
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1 mb-5">
            Try adjusting your search keywords or active filters.
          </Text>
          <TouchableOpacity
            onPress={resetAll}
            className="bg-brand-600 px-5 py-3 rounded-none"
          >
            <Text className="text-white font-semibold text-sm">Clear Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-1 justify-center items-center px-6 pb-20">
          <BookOpen size={48} color="#94a3b8" />
          <Text className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-4 text-center">
            No assignments yet
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">
            Tap "Sync from Teams" above to retrieve your enrolled coursework.
          </Text>
        </View>
      )}

      {/* Floating Action Button for Manual Assignment Creation */}
      <TouchableOpacity
        onPress={() => router.push("/assignment/new")}
        accessibilityLabel="Create new assignment"
        className="absolute bottom-8 right-6 w-14 h-14 rounded-none bg-brand-600 justify-center items-center shadow-lg shadow-blue-500/40"
      >
        <Plus size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
