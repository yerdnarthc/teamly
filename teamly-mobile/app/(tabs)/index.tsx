import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { Sparkles, Calendar, BookOpen, CheckCircle, Clock } from "lucide-react-native";
import { apiClient } from "../../src/services/apiClient";

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

export default function AssignmentsFeedScreen() {
  const router = useRouter();

  const {
    data: assignments,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery<AssignmentListItem[]>({
    queryKey: ["assignments"],
    queryFn: async () => {
      const res = await apiClient.get("/assignments/");
      return res.data;
    },
  });

  const renderItem = ({ item }: { item: AssignmentListItem }) => {
    const isCompleted = item.status.code === "COMPLETED";
    const subjectColor = item.subject?.color || "#3b82f6";

    return (
      <TouchableOpacity
        onPress={() => router.push(`/assignment/${item.id}`)}
        className="bg-white dark:bg-slate-800 p-4 rounded-2xl mb-3 shadow-sm border border-slate-100 dark:border-slate-700 active:opacity-90"
      >
        <View className="flex-row justify-between items-start mb-2">
          {item.subject ? (
            <View
              className="px-2.5 py-1 rounded-full flex-row items-center"
              style={{ backgroundColor: `${subjectColor}15` }}
            >
              <View
                className="w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: subjectColor }}
              />
              <Text
                className="text-xs font-semibold"
                style={{ color: subjectColor }}
              >
                {item.subject.name}
              </Text>
            </View>
          ) : (
            <View className="bg-slate-100 px-2.5 py-1 rounded-full">
              <Text className="text-xs text-slate-600 font-medium">General</Text>
            </View>
          )}

          <View
            className={`px-2 py-0.5 rounded-full ${
              isCompleted
                ? "bg-green-100 text-green-700"
                : item.priority.code === "HIGH"
                ? "bg-rose-100 text-rose-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                isCompleted
                  ? "text-green-700"
                  : item.priority.code === "HIGH"
                  ? "text-rose-700"
                  : "text-amber-700"
              }`}
            >
              {item.status.label}
            </Text>
          </View>
        </View>

        <Text className="text-base font-bold text-slate-900 dark:text-white mb-2" numberOfLines={2}>
          {item.title}
        </Text>

        <View className="flex-row items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-50 dark:border-slate-700/50">
          <View className="flex-row items-center">
            <Clock size={14} color="#64748b" />
            <Text className="text-xs text-slate-500 ml-1">
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

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-slate-500 mt-3 text-sm">Loading assignments...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 px-4 pt-4">
      {assignments && assignments.length > 0 ? (
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
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      ) : (
        <View className="flex-1 justify-center items-center px-6">
          <BookOpen size={48} color="#94a3b8" />
          <Text className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-4 text-center">
            No assignments yet
          </Text>
          <Text className="text-sm text-slate-500 text-center mt-1">
            Synchronize your classes from Microsoft Teams or add a manual assignment.
          </Text>
        </View>
      )}
    </View>
  );
}
