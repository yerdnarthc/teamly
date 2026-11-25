import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useColorScheme } from "nativewind";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Database,
  Clock,
  ChevronRight,
  X,
} from "lucide-react-native";
import { apiClient } from "../../src/services/apiClient";
import { useThemeStore } from "../../src/stores/themeStore";

interface SyncCursorItem {
  subject_id: number;
  subject_name: string;
  subject_color: string;
  last_ok_at: string | null;
  last_error: string;
  has_delta_token: boolean;
}

interface SyncRunItem {
  id: number;
  started_at: string;
  finished_at: string | null;
  new_count: number;
  updated_count: number;
  result: "SUCCESS" | "PARTIAL" | "FAILED";
}

interface AssignmentEventItem {
  id: number;
  kind: string;
  created_at: string;
  assignment: {
    id: number;
    title: string;
    subject_name: string | null;
    subject_color: string | null;
  } | null;
}

interface SyncHistoryResponse {
  summary: {
    total_runs: number;
    total_events: number;
    last_sync_at: string | null;
  };
  cursors: SyncCursorItem[];
  runs: SyncRunItem[];
  events: AssignmentEventItem[];
}

type DiagnosticTab = "ALL" | "RUNS" | "EVENTS";

function formatTimestamp(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getEventBadgeStyle(kind: string): {
  bg: string;
  text: string;
  label: string;
} {
  if (kind === "CREATED") {
    return {
      bg: "bg-emerald-100 dark:bg-emerald-950/70",
      text: "text-emerald-700 dark:text-emerald-300",
      label: "New Task",
    };
  }
  if (kind === "DUE_CHANGED") {
    return {
      bg: "bg-amber-100 dark:bg-amber-950/70",
      text: "text-amber-700 dark:text-amber-300",
      label: "Due Changed",
    };
  }
  return {
    bg: "bg-brand-100 dark:bg-brand-950/70",
    text: "text-brand-700 dark:text-brand-300",
    label: kind.replace(/_/g, " "),
  };
}

export default function SyncHistoryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colorScheme } = useColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const isDark = colorScheme === "dark" || theme === "DARK";

  const [activeTab, setActiveTab] = useState<DiagnosticTab>("ALL");
  const [syncToast, setSyncToast] = useState<string | null>(null);

  useEffect(() => {
    if (!syncToast) return;
    const timer = setTimeout(() => setSyncToast(null), 5000);
    return () => clearTimeout(timer);
  }, [syncToast]);

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<SyncHistoryResponse>({
    queryKey: ["sync-history"],
    queryFn: async () => {
      const res = await apiClient.get("/sync/history/");
      return res.data;
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ message: string }>("/sync/teams/");
      return res.data;
    },
    onSuccess: async (report) => {
      await queryClient.invalidateQueries({ queryKey: ["sync-history"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["workload-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["academic-terms"] });
      queryClient.invalidateQueries({ queryKey: ["ai-workspace"] });
      setSyncToast(report.message);
    },
    onError: (err: any) => {
      Alert.alert(
        "Sync Failed",
        err.response?.data?.detail || "Could not execute Microsoft Teams sync."
      );
    },
  });

  const showRuns = activeTab === "ALL" || activeTab === "RUNS";
  const showEvents = activeTab === "ALL" || activeTab === "EVENTS";

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      className="flex-1 bg-slate-50 dark:bg-slate-900"
    >
      {/* Header Bar */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3 border-b border-slate-200/70 dark:border-slate-800">
        <View className="flex-row items-center flex-1 mr-2">
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
              Sync Diagnostics
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              Runs, cursors & event stream
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex-row items-center bg-brand-600 px-3.5 py-2.5 rounded-2xl"
        >
          {syncMutation.isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <RefreshCw size={14} color="#ffffff" />
          )}
          <Text className="text-xs font-semibold text-white ml-1.5">
            {syncMutation.isPending ? "Syncing..." : "Sync Now"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pinned Confirmation Toast */}
      {syncToast && (
        <View className="mx-5 mt-3 mb-1 flex-row items-center justify-between bg-emerald-50 dark:bg-emerald-950/80 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800">
          <View className="flex-row items-center flex-1 mr-2">
            <CheckCircle2 size={18} color="#10b981" />
            <Text className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 ml-2.5 flex-1 leading-4">
              {syncToast}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setSyncToast(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={15} color="#10b981" />
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            Loading sync diagnostics...
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
            />
          }
        >
          {/* Summary Strip */}
          <View className="flex-row gap-2.5 mb-5">
            <View className="flex-1 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sync Runs
              </Text>
              <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {data?.summary.total_runs ?? 0}
              </Text>
            </View>
            <View className="flex-1 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Events
              </Text>
              <Text className="text-xl font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                {data?.summary.total_events ?? 0}
              </Text>
            </View>
            <View className="flex-1 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Cursors
              </Text>
              <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {data?.cursors.length ?? 0}
              </Text>
            </View>
          </View>

          {/* Course Sync Cursors */}
          {data && data.cursors.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-2.5">
                <Database size={15} color={isDark ? "#60a5fa" : "#2563eb"} />
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1.5">
                  Course Sync Cursors
                </Text>
              </View>

              {data.cursors.map((cursor) => (
                <View
                  key={cursor.subject_id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 mb-2.5 border border-slate-200 dark:border-slate-700"
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View
                        className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0"
                        style={{ backgroundColor: cursor.subject_color || "#3b82f6" }}
                      />
                      <Text
                        className="text-sm font-bold text-slate-900 dark:text-white flex-shrink"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {cursor.subject_name}
                      </Text>
                    </View>

                    <View
                      className={`px-2 py-0.5 rounded-full flex-shrink-0 ${
                        cursor.last_error
                          ? "bg-rose-100 dark:bg-rose-950/60"
                          : cursor.has_delta_token
                          ? "bg-emerald-100 dark:bg-emerald-950/60"
                          : "bg-slate-100 dark:bg-slate-700"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          cursor.last_error
                            ? "text-rose-700 dark:text-rose-300"
                            : cursor.has_delta_token
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {cursor.last_error
                          ? "Error"
                          : cursor.has_delta_token
                          ? "Delta Ready"
                          : "Idle"}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    Last OK: {formatTimestamp(cursor.last_ok_at)}
                  </Text>
                  {cursor.last_error ? (
                    <Text className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                      {cursor.last_error}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Segmented Tab Filter */}
          <View className="flex-row bg-slate-200/70 dark:bg-slate-800 p-1.5 rounded-2xl mb-5 border border-slate-200 dark:border-slate-700">
            {[
              { key: "ALL" as DiagnosticTab, label: "All Logs" },
              { key: "RUNS" as DiagnosticTab, label: "Sync Runs" },
              { key: "EVENTS" as DiagnosticTab, label: "Event Stream" },
            ].map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2 rounded-xl items-center ${
                    isSelected ? "bg-brand-600" : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected
                        ? "text-white"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sync Runs History */}
          {showRuns && (
            <View className="mb-6">
              <View className="flex-row items-center mb-2.5">
                <Clock size={15} color={isDark ? "#60a5fa" : "#2563eb"} />
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1.5">
                  Recent Sync Runs ({data?.runs.length ?? 0})
                </Text>
              </View>

              {data && data.runs.length > 0 ? (
                data.runs.map((run) => {
                  const isSuccess = run.result === "SUCCESS";
                  const isPartial = run.result === "PARTIAL";
                  return (
                    <View
                      key={run.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-2.5 border border-slate-200 dark:border-slate-700 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center flex-1 mr-2">
                        {isSuccess ? (
                          <CheckCircle2 size={18} color="#10b981" />
                        ) : (
                          <AlertCircle
                            size={18}
                            color={isPartial ? "#f59e0b" : "#e11d48"}
                          />
                        )}
                        <View className="ml-3 flex-1">
                          <Text className="text-sm font-bold text-slate-900 dark:text-white">
                            Run #{run.id} · {run.result}
                          </Text>
                          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {formatTimestamp(run.started_at)}
                          </Text>
                        </View>
                      </View>

                      <View className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-xl">
                        <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          +{run.new_count} new · {run.updated_count} upd
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 items-center">
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    No sync runs recorded yet. Tap "Sync Now" above to start.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Assignment Event Stream */}
          {showEvents && (
            <View className="mb-4">
              <View className="flex-row items-center mb-2.5">
                <Activity size={15} color={isDark ? "#60a5fa" : "#2563eb"} />
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1.5">
                  Assignment Event Stream ({data?.events.length ?? 0})
                </Text>
              </View>

              {data && data.events.length > 0 ? (
                data.events.map((evt) => {
                  const style = getEventBadgeStyle(evt.kind);
                  return (
                    <TouchableOpacity
                      key={evt.id}
                      disabled={!evt.assignment}
                      onPress={() => {
                        if (evt.assignment) {
                          router.push(`/assignment/${evt.assignment.id}`);
                        }
                      }}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-2.5 border border-slate-200 dark:border-slate-700"
                    >
                      <View className="flex-row items-center justify-between mb-1.5">
                        <View className={`px-2.5 py-0.5 rounded-full ${style.bg}`}>
                          <Text className={`text-[11px] font-bold ${style.text}`}>
                            {style.label}
                          </Text>
                        </View>
                        <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                          {formatTimestamp(evt.created_at)}
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 mr-2">
                          <Text
                            className="text-sm font-bold text-slate-900 dark:text-white"
                            numberOfLines={2}
                          >
                            {evt.assignment?.title || "Assignment event"}
                          </Text>
                          {evt.assignment?.subject_name && (
                            <Text
                              className="text-xs font-medium mt-0.5"
                              style={{
                                color: evt.assignment.subject_color || "#3b82f6",
                              }}
                              numberOfLines={1}
                            >
                              {evt.assignment.subject_name}
                            </Text>
                          )}
                        </View>
                        {evt.assignment && (
                          <ChevronRight size={16} color="#94a3b8" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 items-center">
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    No assignment ingestion events recorded yet.
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
