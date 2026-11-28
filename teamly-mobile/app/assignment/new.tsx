import React from "react";
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
import { X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "../../src/services/apiClient";
import { useThemeStore } from "../../src/stores/themeStore";
import { DeadlinePickerCard } from "../../src/components/DeadlinePickerCard";
import { PRIORITY_OPTIONS } from "../../src/constants/assignmentLabels";
import {
  assignmentFormSchema,
  type AssignmentFormValues,
} from "../../src/schemas/assignmentSchema";

interface SubjectOption {
  id: number;
  name: string;
  color: string;
}

export default function NewAssignmentScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colorScheme } = useColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const isDark = colorScheme === "dark" || theme === "DARK";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: "",
      instructions: "",
      subjectId: null,
      statusCode: "NOT_STARTED",
      priorityCode: "MEDIUM",
      hasDeadline: false,
      dueDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(23, 59, 0, 0);
        return d;
      })(),
    },
  });

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
      due_at: string | null;
    }) => {
      const res = await apiClient.post("/assignments/", payload);
      return res.data;
    },
    onSuccess: (newAssignment) => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["assignments", "upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["workload-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["ai-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["notification-history"] });
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

  const onSubmit = (values: AssignmentFormValues) => {
    createMutation.mutate({
      title: values.title.trim(),
      instructions: values.instructions.trim(),
      subject_id: values.subjectId,
      priority_code: values.priorityCode,
      status_code: "NOT_STARTED",
      due_at: values.hasDeadline ? values.dueDate.toISOString() : null,
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
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="e.g. Chapter 4 Lab Exercise"
              placeholderTextColor="#94a3b8"
              className="border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
            />
          )}
        />
        {errors.title?.message && (
          <Text className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1.5">
            {errors.title.message}
          </Text>
        )}
      </View>

      {/* Subject Picker */}
      <View className="mb-5">
        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Subject / Class
        </Text>
        {loadingSubjects ? (
          <ActivityIndicator size="small" color="#2563eb" />
        ) : (
          <Controller
            control={control}
            name="subjectId"
            render={({ field: { onChange, value } }) => (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                <TouchableOpacity
                  onPress={() => onChange(null)}
                  className={`mr-2.5 px-4 py-2.5 rounded-2xl border ${
                    value === null
                      ? "bg-brand-600 border-brand-600"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      value === null ? "text-white font-semibold" : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    General / None
                  </Text>
                </TouchableOpacity>

                {subjects?.map((sub) => {
                  const isSelected = value === sub.id;
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      onPress={() => onChange(sub.id)}
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
          />
        )}
      </View>

      {/* Priority Selector */}
      <View className="mb-5">
        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Priority Level
        </Text>
        <Controller
          control={control}
          name="priorityCode"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row gap-2">
              {PRIORITY_OPTIONS.map((p) => {
                const isSelected = value === p.code;
                return (
                  <TouchableOpacity
                    key={p.code}
                    onPress={() => onChange(p.code)}
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
          )}
        />
      </View>

      {/* Deadline Picker */}
      <Controller
        control={control}
        name="hasDeadline"
        render={({ field: { onChange: onToggleDeadline, value: hasDeadlineVal } }) => (
          <Controller
            control={control}
            name="dueDate"
            render={({ field: { onChange: onChangeDueDate, value: dueDateVal } }) => (
              <DeadlinePickerCard
                hasDeadline={hasDeadlineVal}
                onToggleDeadline={onToggleDeadline}
                value={dueDateVal}
                onChange={onChangeDueDate}
                isDark={isDark}
              />
            )}
          />
        )}
      />

      {/* Instructions / Notes */}
      <View className="mb-8">
        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Instructions & Notes
        </Text>
        <Controller
          control={control}
          name="instructions"
          render={({ field: { onChange, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Add assignment requirements, rubrics, or reminders..."
              placeholderTextColor="#94a3b8"
              className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 min-h-[120px]"
            />
          )}
        />
      </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={() => handleSubmit(onSubmit)()}
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
