import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Calendar,
  BookOpen,
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
} from "lucide-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { apiClient } from "../../src/services/apiClient";

interface Subtask {
  id: number;
  title: string;
  is_done: boolean;
  sort_order: number;
}

interface AiSummary {
  summary: string;
  requirements: string[];
  deadlines: string[];
  suggested_subtasks: string[];
  model: string;
}

interface AssignmentDetail {
  id: number;
  title: string;
  instructions: string;
  due_at: string | null;
  status: { id: number; code: string; label: string };
  priority: { id: number; code: string; rank: number };
  subject: { id: number; name: string; color: string } | null;
  subtasks: Subtask[];
  ai_summary: AiSummary | null;
}

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [adoptingTitle, setAdoptingTitle] = useState<string | null>(null);

  const {
    data: assignment,
    isLoading,
    error,
  } = useQuery<AssignmentDetail>({
    queryKey: ["assignment", id],
    queryFn: async () => {
      const res = await apiClient.get(`/assignments/${id}/`);
      return res.data;
    },
  });

  // Mutation: Toggle subtask completion
  const toggleSubtaskMutation = useMutation({
    mutationFn: async (subtaskId: number) => {
      await apiClient.post(`/assignments/subtasks/${subtaskId}/toggle/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment", id] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: () => {
      Alert.alert("Error", "Could not toggle subtask status.");
    },
  });

  // Mutation: Adopt suggested AI subtask
  const adoptSubtaskMutation = useMutation({
    mutationFn: async (title: string) => {
      setAdoptingTitle(title);
      await apiClient.post(`/assignments/${id}/adopt-subtask/`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment", id] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: () => {
      Alert.alert("Error", "Could not adopt suggested subtask.");
    },
    onSettled: () => {
      setAdoptingTitle(null);
    },
  });

  // Mutation: Delete assignment
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/assignments/${id}/`);
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["assignment", id] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["assignments", "upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["workload-metrics"] });
      router.back();
    },
    onError: () => {
      Alert.alert("Delete Failed", "Could not delete this assignment.");
    },
  });

  const handleConfirmDelete = () => {
    Alert.alert(
      "Delete Assignment",
      `Permanently remove "${assignment?.title || "this assignment"}" and all subtasks?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!assignment) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900 p-6">
        <Text className="text-slate-600 dark:text-slate-400">Assignment not found.</Text>
      </View>
    );
  }

  // Check which suggestions are already in subtasks
  const existingSubtaskTitles = new Set(
    assignment.subtasks.map((s) => s.title.toLowerCase().trim())
  );

  return (
    <SafeAreaView edges={["top", "bottom", "left", "right"]} className="flex-1 bg-slate-50 dark:bg-slate-900">
      <ScrollView
        className="flex-1 px-5 pt-3"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back navigation & action header */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 justify-center items-center shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <ArrowLeft size={18} color={isDark ? "#f8fafc" : "#0f172a"} />
          </TouchableOpacity>

          <View className="flex-row items-center gap-2.5">
            <TouchableOpacity
              onPress={() => router.push(`/assignment/${assignment.id}/edit`)}
              disabled={deleteMutation.isPending}
              accessibilityLabel="Edit assignment"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="flex-row items-center px-3.5 h-11 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <Pencil size={15} color={isDark ? "#f8fafc" : "#0f172a"} />
              <Text className="text-xs font-semibold text-slate-900 dark:text-slate-100 ml-1.5">
                Edit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              accessibilityLabel="Delete assignment"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-11 h-11 rounded-full bg-rose-50 dark:bg-rose-950/50 justify-center items-center border border-rose-200 dark:border-rose-900"
            >
              {deleteMutation.isPending ? (
                <ActivityIndicator size="small" color="#e11d48" />
              ) : (
                <Trash2 size={16} color="#e11d48" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Subject & Status */}
        <View className="flex-row items-center justify-between mb-3">
          {assignment.subject && (
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: `${assignment.subject.color}15` }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: assignment.subject.color }}
              >
                {assignment.subject.name}
              </Text>
            </View>
          )}
          <View className="bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
            <Text className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              {assignment.status.label}
            </Text>
          </View>
        </View>

      {/* Title */}
      <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
        {assignment.title}
      </Text>

      {/* Deadline */}
      <View className="flex-row items-center mb-6">
        <Calendar size={16} color="#64748b" />
        <Text className="text-sm text-slate-500 ml-2">
          Due: {assignment.due_at ? new Date(assignment.due_at).toLocaleString() : "No deadline"}
        </Text>
      </View>

      {/* Subtask Checklist Card */}
      <View className="bg-white dark:bg-slate-800 p-5 rounded-3xl mb-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-3">
          Checklist ({assignment.subtasks.filter((s) => s.is_done).length}/
          {assignment.subtasks.length})
        </Text>

        {assignment.subtasks.length > 0 ? (
          assignment.subtasks.map((subtask) => (
            <TouchableOpacity
              key={subtask.id}
              onPress={() => toggleSubtaskMutation.mutate(subtask.id)}
              className="flex-row items-center py-2.5 border-b border-slate-50 dark:border-slate-700/50"
            >
              {subtask.is_done ? (
                <CheckCircle2 size={20} color="#16a34a" />
              ) : (
                <Circle size={20} color="#94a3b8" />
              )}
              <Text
                className={`ml-3 text-base flex-1 ${
                  subtask.is_done
                    ? "line-through text-slate-400 dark:text-slate-500"
                    : "text-slate-800 dark:text-slate-200"
                }`}
              >
                {subtask.title}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text className="text-sm text-slate-400 py-2">
            No subtasks yet. Adopt an AI suggested subtask below!
          </Text>
        )}
      </View>

      {/* AI Assistant Section */}
      {assignment.ai_summary && (
        <View className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:bg-slate-800 p-5 rounded-3xl mb-8 border border-blue-100 dark:border-blue-900/40">
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-full bg-brand-500 justify-center items-center mr-2">
              <Sparkles size={16} color="#ffffff" />
            </View>
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              AI Analysis & Task Proposals
            </Text>
          </View>

          <Text className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            {assignment.ai_summary.summary}
          </Text>

          {/* Suggested Subtasks with One-Click Adoption */}
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Suggested Action Items
          </Text>
          {assignment.ai_summary.suggested_subtasks.map((suggestion, index) => {
            const isAlreadyAdopted = existingSubtaskTitles.has(
              suggestion.toLowerCase().trim()
            );
            const isAdopting = adoptingTitle === suggestion;

            return (
              <View
                key={index}
                className="flex-row items-center justify-between py-2 border-t border-blue-100/60 dark:border-slate-700"
              >
                <Text
                  className="text-sm text-slate-700 dark:text-slate-300 flex-1 mr-2"
                  numberOfLines={2}
                >
                  {suggestion}
                </Text>

                {isAlreadyAdopted ? (
                  <View className="bg-green-100 dark:bg-green-950/60 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                    <Text className="text-xs font-semibold text-green-700 dark:text-green-300">✓ In Checklist</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => adoptSubtaskMutation.mutate(suggestion)}
                    disabled={isAdopting}
                    className="bg-brand-600 px-3 py-1.5 rounded-full flex-row items-center"
                  >
                    {isAdopting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Plus size={14} color="#ffffff" />
                        <Text className="text-xs font-semibold text-white ml-1">Adopt</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

        {/* Instructions */}
        <View className="bg-white dark:bg-slate-800 p-5 rounded-3xl mb-8 border border-slate-100 dark:border-slate-700">
          <Text className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Original Instructions
          </Text>
          <Text className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {assignment.instructions || "No instructions provided."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
