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
  Bell,
  BellOff,
  Clock,
  CheckCircle2,
  ChevronRight,
  Mail,
  Send,
  X,
} from "lucide-react-native";
import { apiClient } from "../../src/services/apiClient";
import { useThemeStore } from "../../src/stores/themeStore";

interface AssignmentBrief {
  id: number;
  title: string;
  due_at: string | null;
  subject_name: string | null;
  subject_color: string | null;
}

interface ReminderItem {
  id: number;
  remind_at: string;
  channel: "IN_APP" | "EMAIL" | string;
  is_sent: boolean;
  assignment: AssignmentBrief | null;
}

interface NotificationLogItem {
  id: number;
  kind: string;
  sent_at: string;
  assignment: AssignmentBrief | null;
}

interface NotificationHistoryResponse {
  summary: {
    pending_count: number;
    delivered_count: number;
    deadline_enabled: boolean;
    lead_hours: number;
    new_assignment: boolean;
  };
  reminders: ReminderItem[];
  logs: NotificationLogItem[];
}

type ViewTab = "ALL" | "QUEUE" | "LOGS";

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getLogKindBadge(kind: string): { bg: string; text: string; label: string } {
  if (kind === "DEADLINE") {
    return {
      bg: "bg-amber-100 dark:bg-amber-950/70",
      text: "text-amber-700 dark:text-amber-300",
      label: "Deadline Alert",
    };
  }
  if (kind === "NEW_ASSIGNMENT") {
    return {
      bg: "bg-brand-100 dark:bg-brand-950/70",
      text: "text-brand-700 dark:text-brand-300",
      label: "New Assignment",
    };
  }
  return {
    bg: "bg-emerald-100 dark:bg-emerald-950/70",
    text: "text-emerald-700 dark:text-emerald-300",
    label: kind.replace(/_/g, " "),
  };
}

export default function NotificationHistoryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colorScheme } = useColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const isDark = colorScheme === "dark" || theme === "DARK";

  const [activeTab, setActiveTab] = useState<ViewTab>("ALL");
  const [dismissingId, setDismissingId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 4500);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<NotificationHistoryResponse>({
    queryKey: ["notification-history"],
    queryFn: async () => {
      const res = await apiClient.get("/notifications/history/");
      return res.data;
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (reminderId: number) => {
      setDismissingId(reminderId);
      await apiClient.delete(`/notifications/reminders/${reminderId}/`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notification-history"] });
      setToastMsg("Scheduled reminder dismissed.");
    },
    onError: () => {
      Alert.alert("Error", "Could not dismiss reminder. Please try again.");
    },
    onSettled: () => setDismissingId(null),
  });

  const showQueue = activeTab === "ALL" || activeTab === "QUEUE";
  const showLogs = activeTab === "ALL" || activeTab === "LOGS";

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
              Reminders & Alerts
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              Scheduled queue & delivery log
            </Text>
          </View>
        </View>

        {data?.summary && (
          <View
            className={`px-2.5 py-1 rounded-full border ${
              data.summary.deadline_enabled
                ? "bg-brand-50 dark:bg-brand-950/60 border-brand-200 dark:border-brand-800"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            }`}
          >
            <Text
              className={`text-[11px] font-bold ${
                data.summary.deadline_enabled
                  ? "text-brand-700 dark:text-brand-300"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {data.summary.deadline_enabled
                ? `${data.summary.lead_hours}h lead`
                : "Paused"}
            </Text>
          </View>
        )}
      </View>

      {/* Pinned Feedback Banner */}
      {toastMsg && (
        <View className="mx-5 mt-3 mb-1 flex-row items-center justify-between bg-emerald-50 dark:bg-emerald-950/80 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800">
          <View className="flex-row items-center flex-1 mr-2">
            <CheckCircle2 size={18} color="#10b981" />
            <Text className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 ml-2.5 flex-1">
              {toastMsg}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setToastMsg(null)}
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
            Loading reminder schedule...
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
                Queued
              </Text>
              <Text className="text-xl font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                {data?.summary.pending_count ?? 0}
              </Text>
            </View>
            <View className="flex-1 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Delivered
              </Text>
              <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {data?.summary.delivered_count ?? 0}
              </Text>
            </View>
            <View className="flex-1 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Lead Time
              </Text>
              <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {data?.summary.lead_hours ?? 24}h
              </Text>
            </View>
          </View>

          {/* Segmented Filter */}
          <View className="flex-row bg-slate-200/70 dark:bg-slate-800 p-1.5 rounded-2xl mb-5 border border-slate-200 dark:border-slate-700">
            {[
              { key: "ALL" as ViewTab, label: "All" },
              { key: "QUEUE" as ViewTab, label: "Scheduled Queue" },
              { key: "LOGS" as ViewTab, label: "Delivery Log" },
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

          {/* Scheduled Reminders Queue */}
          {showQueue && (
            <View className="mb-6">
              <View className="flex-row items-center mb-2.5">
                <Clock size={15} color={isDark ? "#60a5fa" : "#2563eb"} />
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1.5">
                  Scheduled Reminders ({data?.reminders.length ?? 0})
                </Text>
              </View>

              {data && data.reminders.length > 0 ? (
                data.reminders.map((rem) => {
                  const isDismissing = dismissingId === rem.id;
                  return (
                    <View
                      key={rem.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-2.5 border border-slate-200 dark:border-slate-700"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800">
                          {rem.channel === "EMAIL" ? (
                            <Mail size={11} color={isDark ? "#93c5fd" : "#2563eb"} />
                          ) : (
                            <Bell size={11} color={isDark ? "#93c5fd" : "#2563eb"} />
                          )}
                          <Text className="text-[11px] font-bold text-brand-700 dark:text-brand-300 ml-1.5">
                            {rem.channel === "EMAIL" ? "Email" : "In-App"} ·{" "}
                            {formatTimestamp(rem.remind_at)}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => dismissMutation.mutate(rem.id)}
                          disabled={isDismissing}
                          accessibilityLabel="Dismiss scheduled reminder"
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          className="flex-row items-center px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700"
                        >
                          {isDismissing ? (
                            <ActivityIndicator size="small" color="#64748b" />
                          ) : (
                            <>
                              <BellOff size={12} color={isDark ? "#cbd5e1" : "#475569"} />
                              <Text className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 ml-1">
                                Dismiss
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        disabled={!rem.assignment}
                        onPress={() => {
                          if (rem.assignment) {
                            router.push(`/assignment/${rem.assignment.id}`);
                          }
                        }}
                        className="flex-row items-center justify-between"
                      >
                        <View className="flex-1 mr-2">
                          <Text
                            className="text-sm font-bold text-slate-900 dark:text-white"
                            numberOfLines={2}
                          >
                            {rem.assignment?.title || "Scheduled Assignment"}
                          </Text>
                          {rem.assignment?.subject_name && (
                            <Text
                              className="text-xs font-medium mt-0.5"
                              style={{
                                color: rem.assignment.subject_color || "#3b82f6",
                              }}
                              numberOfLines={1}
                            >
                              {rem.assignment.subject_name}
                            </Text>
                          )}
                        </View>
                        {rem.assignment && (
                          <ChevronRight size={16} color="#94a3b8" />
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })
              ) : (
                <View className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 items-center">
                  <Bell size={32} color="#94a3b8" />
                  <Text className="text-sm font-bold text-slate-800 dark:text-white mt-2">
                    No Scheduled Reminders
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
                    Reminders are automatically queued when assignments have deadlines and alerts are enabled.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Delivery Log */}
          {showLogs && (
            <View className="mb-4">
              <View className="flex-row items-center mb-2.5">
                <Send size={15} color={isDark ? "#60a5fa" : "#2563eb"} />
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1.5">
                  Delivery History ({data?.logs.length ?? 0})
                </Text>
              </View>

              {data && data.logs.length > 0 ? (
                data.logs.map((log) => {
                  const badge = getLogKindBadge(log.kind);
                  return (
                    <TouchableOpacity
                      key={log.id}
                      disabled={!log.assignment}
                      onPress={() => {
                        if (log.assignment) {
                          router.push(`/assignment/${log.assignment.id}`);
                        }
                      }}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-2.5 border border-slate-200 dark:border-slate-700"
                    >
                      <View className="flex-row items-center justify-between mb-1.5">
                        <View className={`px-2.5 py-0.5 rounded-full ${badge.bg}`}>
                          <Text className={`text-[11px] font-bold ${badge.text}`}>
                            {badge.label}
                          </Text>
                        </View>
                        <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                          {formatTimestamp(log.sent_at)}
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 mr-2">
                          <Text
                            className="text-sm font-bold text-slate-900 dark:text-white"
                            numberOfLines={2}
                          >
                            {log.assignment?.title || "System Notification"}
                          </Text>
                          {log.assignment?.subject_name && (
                            <Text
                              className="text-xs font-medium mt-0.5"
                              style={{
                                color: log.assignment.subject_color || "#3b82f6",
                              }}
                              numberOfLines={1}
                            >
                              {log.assignment.subject_name}
                            </Text>
                          )}
                        </View>
                        {log.assignment && (
                          <ChevronRight size={16} color="#94a3b8" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 items-center">
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    No notifications have been delivered yet.
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
