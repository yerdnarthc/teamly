import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ListTodo,
  Sparkles,
} from "lucide-react-native";
import { apiClient } from "../../src/services/apiClient";
import { AssignmentListItem } from "./index";

interface WorkloadMetrics {
  total_count: number;
  completed_count: number;
  active_count: number;
  overdue_count: number;
}

interface DeadlineGroup {
  key: string;
  title: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  data: AssignmentListItem[];
}

function formatDueText(dueAtStr: string | null): {
  label: string;
  isOverdue: boolean;
  isUrgent: boolean;
} {
  if (!dueAtStr) return { label: "No due date", isOverdue: false, isUrgent: false };
  const now = new Date();
  const due = new Date(dueAtStr);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = due.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (diffMs < 0) {
    const overdueHours = Math.abs(diffHours);
    if (overdueHours < 24) {
      return { label: `${overdueHours}h overdue`, isOverdue: true, isUrgent: true };
    }
    const overdueDays = Math.abs(diffDays);
    return { label: `${overdueDays}d overdue`, isOverdue: true, isUrgent: true };
  }

  if (diffHours <= 12) {
    return { label: `In ${diffHours}h (${timeStr})`, isOverdue: false, isUrgent: true };
  }

  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  if (due.getTime() <= todayEnd.getTime()) {
    return { label: `Today · ${timeStr}`, isOverdue: false, isUrgent: true };
  }

  const tomorrowEnd = new Date(todayEnd.getTime() + 24 * 60 * 60 * 1000);
  if (due.getTime() <= tomorrowEnd.getTime()) {
    return { label: `Tomorrow · ${timeStr}`, isOverdue: false, isUrgent: false };
  }

  const monthDay = due.toLocaleDateString([], { month: "short", day: "numeric" });
  return { label: `${monthDay} · ${timeStr}`, isOverdue: false, isUrgent: false };
}

export default function UpcomingScreen() {
  const router = useRouter();

  // 1. Fetch workload summary metrics
  const {
    data: metrics,
    refetch: refetchMetrics,
    isRefetching: isRefetchingMetrics,
  } = useQuery<WorkloadMetrics>({
    queryKey: ["workload-metrics"],
    queryFn: async () => {
      const res = await apiClient.get("/assignments/metrics/");
      return res.data;
    },
  });

  // 2. Fetch upcoming assignments ordered chronologically
  const {
    data: assignments,
    isLoading,
    isRefetching: isRefetchingUpcoming,
    refetch: refetchUpcoming,
  } = useQuery<AssignmentListItem[]>({
    queryKey: ["assignments", "upcoming"],
    queryFn: async () => {
      const res = await apiClient.get("/assignments/?upcoming=true");
      return res.data;
    },
  });

  const isRefreshing = isRefetchingMetrics || isRefetchingUpcoming;

  const handleRefresh = async () => {
    await Promise.all([refetchMetrics(), refetchUpcoming()]);
  };

  // Group assignments into chronological deadline buckets
  const groupedSections = useMemo(() => {
    if (!assignments || assignments.length === 0) return [];

    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const tomorrowEnd = new Date(todayEnd.getTime() + 24 * 60 * 60 * 1000);
    const weekEnd = new Date(todayEnd.getTime() + 7 * 24 * 60 * 60 * 1000);

    const overdueList: AssignmentListItem[] = [];
    const todayList: AssignmentListItem[] = [];
    const tomorrowList: AssignmentListItem[] = [];
    const thisWeekList: AssignmentListItem[] = [];
    const laterList: AssignmentListItem[] = [];

    for (const item of assignments) {
      if (!item.due_at) continue;
      const dueDate = new Date(item.due_at);
      const time = dueDate.getTime();

      if (time < now.getTime()) {
        overdueList.push(item);
      } else if (time <= todayEnd.getTime()) {
        todayList.push(item);
      } else if (time <= tomorrowEnd.getTime()) {
        tomorrowList.push(item);
      } else if (time <= weekEnd.getTime()) {
        thisWeekList.push(item);
      } else {
        laterList.push(item);
      }
    }

    const sections: DeadlineGroup[] = [];

    if (overdueList.length > 0) {
      sections.push({
        key: "overdue",
        title: "Overdue",
        badgeBg: "bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900",
        badgeText: "text-rose-700 dark:text-rose-300",
        dotColor: "#e11d48",
        data: overdueList,
      });
    }

    if (todayList.length > 0) {
      sections.push({
        key: "today",
        title: "Due Today",
        badgeBg: "bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900",
        badgeText: "text-amber-700 dark:text-amber-300",
        dotColor: "#d97706",
        data: todayList,
      });
    }

    if (tomorrowList.length > 0) {
      sections.push({
        key: "tomorrow",
        title: "Due Tomorrow",
        badgeBg: "bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900",
        badgeText: "text-blue-700 dark:text-blue-300",
        dotColor: "#2563eb",
        data: tomorrowList,
      });
    }

    if (thisWeekList.length > 0) {
      sections.push({
        key: "this-week",
        title: "Later This Week",
        badgeBg: "bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900",
        badgeText: "text-indigo-700 dark:text-indigo-300",
        dotColor: "#6366f1",
        data: thisWeekList,
      });
    }

    if (laterList.length > 0) {
      sections.push({
        key: "later",
        title: "Upcoming Later",
        badgeBg: "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
        badgeText: "text-slate-700 dark:text-slate-300",
        dotColor: "#64748b",
        data: laterList,
      });
    }

    return sections;
  }, [assignments]);

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-slate-50 dark:bg-slate-900">
      <ScrollView
        className="flex-1 px-5 pt-3"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Screen Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">
            Upcoming Deadlines
          </Text>
          <Text className="text-xs text-slate-500 mt-0.5">
            Chronological milestones & approaching coursework
          </Text>
        </View>

        {/* Workload Metrics Banner */}
        <View className="flex-row gap-2.5 mb-6">
          {/* Active Card */}
          <View className="flex-1 bg-white dark:bg-slate-800 p-3.5 rounded-none border border-slate-100 dark:border-slate-700">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active
            </Text>
            <Text className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">
              {metrics?.active_count ?? "-"}
            </Text>
          </View>

          {/* Overdue Card */}
          <View
            className={`flex-1 p-3.5 rounded-none border ${
              (metrics?.overdue_count ?? 0) > 0
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900"
                : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
            }`}
          >
            <Text
              className={`text-[10px] font-bold uppercase tracking-wider ${
                (metrics?.overdue_count ?? 0) > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-400"
              }`}
            >
              Overdue
            </Text>
            <Text
              className={`text-xl font-bold mt-0.5 ${
                (metrics?.overdue_count ?? 0) > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-800 dark:text-white"
              }`}
            >
              {metrics?.overdue_count ?? 0}
            </Text>
          </View>

          {/* Completed Card */}
          <View className="flex-1 bg-white dark:bg-slate-800 p-3.5 rounded-none border border-slate-100 dark:border-slate-700">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Completed
            </Text>
            <Text className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {metrics?.completed_count ?? "-"}
            </Text>
          </View>
        </View>

        {/* Content Loading State */}
        {isLoading ? (
          <View className="py-20 justify-center items-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-xs text-slate-500 mt-3">Loading schedule...</Text>
          </View>
        ) : groupedSections.length > 0 ? (
          /* Chronological Deadline Sections */
          groupedSections.map((section) => (
            <View key={section.key} className="mb-6">
              {/* Section Header */}
              <View className="flex-row items-center mb-2.5">
                <View
                  className="w-2.5 h-2.5 rounded-full mr-2"
                  style={{ backgroundColor: section.dotColor }}
                />
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 flex-1">
                  {section.title}
                </Text>
                <View className={`px-2 py-0.5 rounded-none ${section.badgeBg}`}>
                  <Text className={`text-[11px] font-semibold ${section.badgeText}`}>
                    {section.data.length}
                  </Text>
                </View>
              </View>

              {/* Assignment Cards */}
              {section.data.map((item) => {
                const dueInfo = formatDueText(item.due_at);
                const subjectColor = item.subject?.color || "#3b82f6";

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push(`/assignment/${item.id}`)}
                    className="bg-white dark:bg-slate-800 p-4 rounded-none mb-3 border border-slate-100 dark:border-slate-700"
                  >
                    {/* Top Row: Subject (Left) and Priority / Source (Right) */}
                    <View className="flex-row justify-between items-center mb-2.5">
                      <View className="flex-1 mr-2">
                        {item.subject ? (
                          <View
                            className="px-2.5 py-1 rounded-none flex-row items-center self-start max-w-[85%]"
                            style={{ backgroundColor: `${subjectColor}15` }}
                          >
                            <View
                              className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
                              style={{ backgroundColor: subjectColor }}
                            />
                            <Text
                              className="text-xs font-semibold"
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

                      {item.priority.code === "HIGH" || item.priority.code === "URGENT" ? (
                        <View className="bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-none border border-rose-200 dark:border-rose-900 flex-shrink-0">
                          <Text className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                            {item.priority.code === "URGENT" ? "Urgent" : "High"}
                          </Text>
                        </View>
                      ) : item.source === "TEAMS" ? (
                        <View className="bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-none border border-indigo-200 dark:border-indigo-900 flex-shrink-0">
                          <Text className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            Teams
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Middle: Title */}
                    <Text
                      className="text-base font-bold text-slate-900 dark:text-white mb-3"
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>

                    {/* Dedicated Bottom Row: Deadline Badge (Left) & Metadata (Right) */}
                    <View className="flex-row items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
                      {/* Due Countdown Tag with full breathing room */}
                      <View
                        className={`px-2.5 py-1 rounded-none flex-row items-center border ${
                          dueInfo.isOverdue
                            ? "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800"
                            : dueInfo.isUrgent
                            ? "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800"
                            : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                        }`}
                      >
                        {dueInfo.isOverdue ? (
                          <AlertCircle size={12} color="#e11d48" />
                        ) : (
                          <Clock size={12} color={dueInfo.isUrgent ? "#d97706" : "#64748b"} />
                        )}
                        <Text
                          className={`text-xs font-semibold ml-1.5 ${
                            dueInfo.isOverdue
                              ? "text-rose-700 dark:text-rose-300"
                              : dueInfo.isUrgent
                              ? "text-amber-800 dark:text-amber-200"
                              : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {dueInfo.label}
                        </Text>
                      </View>

                      {/* Right: Subtasks / Action Chevron */}
                      <View className="flex-row items-center ml-2">
                        {item.subtask_count > 0 && (
                          <View className="flex-row items-center mr-2 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-none">
                            <ListTodo size={11} color="#64748b" />
                            <Text className="text-[11px] text-slate-600 dark:text-slate-300 ml-1 font-medium">
                              {item.completed_subtask_count}/{item.subtask_count}
                            </Text>
                          </View>
                        )}
                        <ChevronRight size={15} color="#94a3b8" />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        ) : (
          /* Empty State: All caught up */
          <View className="py-20 justify-center items-center px-6">
            <View className="w-16 h-16 rounded-none bg-emerald-100 dark:bg-emerald-950/60 justify-center items-center mb-4">
              <CheckCircle2 size={36} color="#059669" />
            </View>
            <Text className="text-lg font-bold text-slate-800 dark:text-white text-center mb-1">
              All Caught Up!
            </Text>
            <Text className="text-sm text-slate-500 text-center max-w-xs leading-5">
              You have no active deadlines approaching. Excellent work staying ahead of your courses!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
