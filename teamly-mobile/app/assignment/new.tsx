import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, AlertCircle, Calendar, Check, X } from "lucide-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "../../src/services/apiClient";

interface SubjectOption {
  id: number;
  name: string;
  color: string;
}

export default function NewAssignmentScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [priorityCode, setPriorityCode] = useState<"HIGH" | "MED" | "LOW">("MED");

  // Fetch student's enrolled subjects for the picker
  const { data: subjects, isLoading: loadingSubjects } = useQuery<SubjectOption[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await apiClient.get("/academic/subjects/");
      return res.data;
    },
  });

  // Mutation to create assignment
  const createMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      instructions: string;
      subject_id: number | null;
      priority_code: string;
      status_code: string;
    }) => {
      const res = await apiClient.post("/assignments/", payload);
      return res.data;
    },
    onSuccess: (newAssignment) => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      Alert.alert("Success", "Assignment created successfully!", [
        {
          text: "View Assignment",
          onPress: () => router.replace(`/assignment/${newAssignment.id}`),
        },
        {
          text: "Done",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (err: any) => {
      Alert.alert(
        "Creation Failed",
        err.response?.data?.title?.[0] || "Could not save assignment."
      );
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Please provide an assignment title.");
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      instructions: instructions.trim(),
      subject_id: selectedSubjectId,
      priority_code: priorityCode,
      status_code: "NOT_STARTED",
    });
  };

  return (
    <SafeAreaView edges={["top", "bottom", "left", "right"]} className="flex-1 bg-white dark:bg-slate-900">
      <ScrollView
        className="flex-1 px-5 pt-3"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header bar */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">
            New Assignment
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 justify-center items-center"
          >
            <X size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

      {/* Title Input */}
      <View className="mb-5">
        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Assignment Title *
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Chapter 4 Lab Exercise"
          placeholderTextColor="#94a3b8"
          className="border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
        />
      </View>

      {/* Subject Picker */}
      <View className="mb-5">
        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Subject / Class
        </Text>
        {loadingSubjects ? (
          <ActivityIndicator size="small" color="#2563eb" />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            <TouchableOpacity
              onPress={() => setSelectedSubjectId(null)}
              className={`mr-2.5 px-4 py-2.5 rounded-2xl border ${
                selectedSubjectId === null
                  ? "bg-brand-600 border-brand-600"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedSubjectId === null ? "text-white font-semibold" : "text-slate-700 dark:text-slate-300"
                }`}
              >
                General / None
              </Text>
            </TouchableOpacity>

            {subjects?.map((sub) => {
              const isSelected = selectedSubjectId === sub.id;
              return (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => setSelectedSubjectId(sub.id)}
                  className={`mr-2.5 px-4 py-2.5 rounded-2xl border flex-row items-center ${
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
                    className={`text-sm ${
                      isSelected ? "text-white font-semibold" : "text-slate-700 dark:text-slate-300 font-medium"
                    }`}
                  >
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Priority Selector */}
      <View className="mb-5">
        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Priority Level
        </Text>
        <View className="flex-row space-x-3">
          {[
            { code: "LOW", label: "Low", color: "bg-slate-100 text-slate-700 border-slate-300" },
            { code: "MED", label: "Medium", color: "bg-amber-50 text-amber-700 border-amber-300" },
            { code: "HIGH", label: "High", color: "bg-rose-50 text-rose-700 border-rose-300" },
          ].map((p) => {
            const isSelected = priorityCode === p.code;
            return (
              <TouchableOpacity
                key={p.code}
                onPress={() => setPriorityCode(p.code as any)}
                className={`flex-1 py-3 rounded-2xl items-center border ${
                  isSelected
                    ? "bg-brand-600 border-brand-600"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                }`}
              >
                <Text
                  className={`font-semibold text-sm ${
                    isSelected ? "text-white" : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Instructions / Notes */}
      <View className="mb-8">
        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Instructions & Notes
        </Text>
        <TextInput
          value={instructions}
          onChangeText={setInstructions}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholder="Add assignment requirements, rubrics, or reminders..."
          placeholderTextColor="#94a3b8"
          className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 min-h-[120px]"
        />
      </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          className="w-full bg-brand-600 py-4 rounded-2xl items-center shadow-sm mb-8"
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-base">Create Assignment</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
