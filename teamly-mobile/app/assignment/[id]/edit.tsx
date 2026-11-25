import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Trash2,
  Check,
  AlertCircle,
  Info,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { apiClient } from "../../../src/services/apiClient";
import { useThemeStore } from "../../../src/stores/themeStore";

interface SubjectOption {
  id: number;
  name: string;
  color: string;
}

interface AssignmentDetail {
  id: number;
  title: string;
  instructions: string;
  due_at: string | null;
  source: string;
  status: { id: number; code: string; label: string };
  priority: { id: number; code: string; rank: number };
  subject: { id: number; name: string; color: string } | null;
}

type StatusCode = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
type PriorityCode = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

const STATUS_OPTIONS: Array<{ code: StatusCode; label: string }> = [
  { code: "NOT_STARTED", label: "Not Started" },
  { code: "IN_PROGRESS", label: "In Progress" },
  { code: "COMPLETED", label: "Completed" },
];

const PRIORITY_OPTIONS: Array<{ code: PriorityCode; label: string }> = [
  { code: "LOW", label: "Low" },
  { code: "MEDIUM", label: "Medium" },
  { code: "HIGH", label: "High" },
  { code: "URGENT", label: "Urgent" },
];

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${mins}`;
}

function parseDateAndTime(dateStr: string, timeStr: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeStr.trim());
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

export default function EditAssignmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colorScheme } = useColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const isDark = colorScheme === "dark" || theme === "DARK";

  const [initialized, setInitialized] = useState(false);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [statusCode, setStatusCode] = useState<StatusCode>("NOT_STARTED");
  const [priorityCode, setPriorityCode] = useState<PriorityCode>("MEDIUM");
  const [hasDeadline, setHasDeadline] = useState(false);
  const [dueDateStr, setDueDateStr] = useState("");
  const [dueTimeStr, setDueTimeStr] = useState("23:59");
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: assignment, isLoading: loadingAssignment } = useQuery<AssignmentDetail>({
    queryKey: ["assignment", id],
    queryFn: async () => {
      const res = await apiClient.get(`/assignments/${id}/`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: subjects, isLoading: loadingSubjects } = useQuery<SubjectOption[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await apiClient.get("/academic/subjects/");
      return res.data;
    },
  });

  useEffect(() => {
    if (assignment && !initialized) {
      setTitle(assignment.title || "");
      setInstructions(assignment.instructions || "");
      setSelectedSubjectId(assignment.subject?.id ?? null);

      const rawStatus = assignment.status?.code as StatusCode;
      if (STATUS_OPTIONS.some((s) => s.code === rawStatus)) {
        setStatusCode(rawStatus);
      }

      const rawPriority = assignment.priority?.code === "MED" ? "MEDIUM" : assignment.priority?.code;
      if (PRIORITY_OPTIONS.some((p) => p.code === rawPriority)) {
        setPriorityCode(rawPriority as PriorityCode);
      }

      if (assignment.due_at) {
        const parsed = new Date(assignment.due_at);
        if (!Number.isNaN(parsed.getTime())) {
          setHasDeadline(true);
          setDueDateStr(formatDateInput(parsed));
          setDueTimeStr(formatTimeInput(parsed));
        }
      } else {
        setHasDeadline(false);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDueDateStr(formatDateInput(tomorrow));
        setDueTimeStr("23:59");
      }

      setInitialized(true);
    }
  }, [assignment, initialized]);

  const invalidateAssignmentQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["assignment", id] });
    queryClient.invalidateQueries({ queryKey: ["assignments"] });
    queryClient.invalidateQueries({ queryKey: ["assignments", "upcoming"] });
    queryClient.invalidateQueries({ queryKey: ["workload-metrics"] });
  };

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      instructions: string;
      subject_id: number | null;
      status_code: StatusCode;
      priority_code: PriorityCode;
      due_at: string | null;
    }) => {
      const res = await apiClient.patch(`/assignments/${id}/`, payload);
      return res.data;
    },
    onSuccess: () => {
      invalidateAssignmentQueries();
      router.back();
    },
    onError: (err: any) => {
      const data = err.response?.data;
      const msg =
        data?.title?.[0] ||
        data?.due_at?.[0] ||
        data?.detail ||
        "Could not update assignment. Please try again.";
      setValidationError(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/assignments/${id}/`);
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["assignment", id] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["assignments", "upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["workload-metrics"] });
      router.replace("/(tabs)");
    },
    onError: () => {
      Alert.alert("Delete Failed", "Could not delete this assignment. Please try again.");
    },
  });

  const applyQuickDeadline = (daysFromToday: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromToday);
    setHasDeadline(true);
    setDueDateStr(formatDateInput(target));
    setDueTimeStr("23:59");
    setValidationError(null);
  };

  const handleSave = () => {
    setValidationError(null);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError("Assignment title cannot be empty.");
      return;
    }

    let dueAtIso: string | null = null;
    if (hasDeadline) {
      const parsed = parseDateAndTime(dueDateStr, dueTimeStr);
      if (!parsed) {
        setValidationError("Enter a valid date (YYYY-MM-DD) and 24-hour time (HH:MM).");
        return;
      }
      dueAtIso = parsed.toISOString();
    }

    updateMutation.mutate({
      title: trimmedTitle,
      instructions: instructions.trim(),
      subject_id: selectedSubjectId,
      status_code: statusCode,
      priority_code: priorityCode,
      due_at: dueAtIso,
    });
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete Assignment",
      `Are you sure you want to permanently delete "${assignment?.title || "this assignment"}" and all of its subtasks?`,
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

  if (loadingAssignment && !initialized) {
    return (
      <SafeAreaView
        edges={["top", "bottom", "left", "right"]}
        className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900"
      >
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (!assignment) {
    return (
      <SafeAreaView
        edges={["top", "bottom", "left", "right"]}
        className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900 p-6"
      >
        <Text className="text-slate-600 dark:text-slate-400 mb-4">Assignment not found.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-brand-600 px-5 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isBusy = updateMutation.isPending || deleteMutation.isPending;

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      className="flex-1 bg-slate-50 dark:bg-slate-900"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-5 pt-3"
          contentContainerStyle={{ paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Bar */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => router.back()}
                disabled={isBusy}
                accessibilityLabel="Back to assignment details"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 justify-center items-center border border-slate-200 dark:border-slate-700 mr-3"
              >
                <ArrowLeft size={18} color={isDark ? "#f8fafc" : "#0f172a"} />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-slate-900 dark:text-white">
                Edit Assignment
              </Text>
            </View>

            <TouchableOpacity
              onPress={confirmDelete}
              disabled={isBusy}
              accessibilityLabel="Delete assignment"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-11 h-11 rounded-full bg-rose-50 dark:bg-rose-950/50 justify-center items-center border border-rose-200 dark:border-rose-900"
            >
              <Trash2 size={18} color="#e11d48" />
            </TouchableOpacity>
          </View>

          {/* Teams Source Notice */}
          {assignment.source === "TEAMS" && (
            <View className="flex-row items-start bg-blue-50 dark:bg-blue-950/40 p-3.5 rounded-2xl mb-5 border border-blue-200 dark:border-blue-900">
              <Info size={16} color={isDark ? "#60a5fa" : "#2563eb"} className="mt-0.5" />
              <Text className="text-xs text-blue-800 dark:text-blue-200 ml-2.5 flex-1 leading-4">
                Synced from Microsoft Teams. Your student status, priority, and notes are preserved across future syncs.
              </Text>
            </View>
          )}

          {/* Inline Validation Banner */}
          {validationError && (
            <View className="flex-row items-center bg-rose-50 dark:bg-rose-950/60 p-3.5 rounded-2xl mb-5 border border-rose-200 dark:border-rose-900">
              <AlertCircle size={18} color="#e11d48" />
              <Text className="text-xs font-medium text-rose-800 dark:text-rose-200 ml-2.5 flex-1">
                {validationError}
              </Text>
            </View>
          )}

          {/* Title Input */}
          <View className="mb-5">
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Assignment Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={(val) => {
                setTitle(val);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g. Chapter 4 Lab Exercise"
              placeholderTextColor="#94a3b8"
              className="border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800"
            />
          </View>

          {/* Status Selector */}
          <View className="mb-5">
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Progress Status
            </Text>
            <View className="flex-row bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = statusCode === opt.code;
                return (
                  <TouchableOpacity
                    key={opt.code}
                    onPress={() => setStatusCode(opt.code)}
                    className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
                      isSelected ? "bg-brand-600" : "bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? "text-white" : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Priority Selector */}
          <View className="mb-5">
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Priority Level
            </Text>
            <View className="flex-row gap-2">
              {PRIORITY_OPTIONS.map((p) => {
                const isSelected = priorityCode === p.code;
                return (
                  <TouchableOpacity
                    key={p.code}
                    onPress={() => setPriorityCode(p.code)}
                    className={`flex-1 py-3 rounded-2xl items-center border ${
                      isSelected
                        ? "bg-brand-600 border-brand-600"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
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

          {/* Subject Picker */}
          <View className="mb-5">
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
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
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedSubjectId === null
                        ? "text-white font-semibold"
                        : "text-slate-700 dark:text-slate-300"
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
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <View
                        className="w-2.5 h-2.5 rounded-full mr-2"
                        style={{ backgroundColor: sub.color || "#3b82f6" }}
                      />
                      <Text
                        className={`text-sm ${
                          isSelected
                            ? "text-white font-semibold"
                            : "text-slate-700 dark:text-slate-300 font-medium"
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

          {/* Deadline Editor Card */}
          <View className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Calendar size={18} color={isDark ? "#60a5fa" : "#2563eb"} />
                <Text className="text-sm font-bold text-slate-900 dark:text-white ml-2">
                  Due Date & Time
                </Text>
              </View>
              <Switch
                value={hasDeadline}
                onValueChange={(val) => {
                  setHasDeadline(val);
                  if (val && !dueDateStr) {
                    applyQuickDeadline(1);
                  }
                }}
                trackColor={{ false: "#cbd5e1", true: "#2563eb" }}
                thumbColor="#ffffff"
              />
            </View>

            {hasDeadline ? (
              <>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {[
                    { label: "Today", days: 0 },
                    { label: "Tomorrow", days: 1 },
                    { label: "+3 Days", days: 3 },
                    { label: "+1 Week", days: 7 },
                  ].map((preset) => (
                    <TouchableOpacity
                      key={preset.label}
                      onPress={() => applyQuickDeadline(preset.days)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                    >
                      <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Date (YYYY-MM-DD)
                    </Text>
                    <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-3 bg-slate-50 dark:bg-slate-900">
                      <Calendar size={14} color="#94a3b8" />
                      <TextInput
                        value={dueDateStr}
                        onChangeText={(val) => {
                          setDueDateStr(val);
                          if (validationError) setValidationError(null);
                        }}
                        placeholder="2026-12-01"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numbers-and-punctuation"
                        className="flex-1 py-2.5 px-2 text-sm text-slate-900 dark:text-white"
                      />
                    </View>
                  </View>

                  <View className="w-28">
                    <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Time (24h)
                    </Text>
                    <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-3 bg-slate-50 dark:bg-slate-900">
                      <Clock size={14} color="#94a3b8" />
                      <TextInput
                        value={dueTimeStr}
                        onChangeText={(val) => {
                          setDueTimeStr(val);
                          if (validationError) setValidationError(null);
                        }}
                        placeholder="23:59"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numbers-and-punctuation"
                        className="flex-1 py-2.5 px-2 text-sm text-slate-900 dark:text-white"
                      />
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <Text className="text-xs text-slate-500 dark:text-slate-400">
                No deadline set. Toggle on to track this task in Upcoming Deadlines.
              </Text>
            )}
          </View>

          {/* Instructions / Notes */}
          <View className="mb-6">
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
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
              className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800 min-h-[120px]"
            />
          </View>

          {/* Primary Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isBusy}
            className="w-full bg-brand-600 py-4 rounded-2xl items-center flex-row justify-center mb-6"
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Check size={18} color="#ffffff" />
                <Text className="text-white font-bold text-base ml-2">Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Danger Zone: Delete Assignment */}
          <View className="bg-rose-50/70 dark:bg-rose-950/30 p-4 rounded-3xl border border-rose-200 dark:border-rose-900">
            <Text className="text-sm font-bold text-rose-800 dark:text-rose-200 mb-1">
              Danger Zone
            </Text>
            <Text className="text-xs text-rose-700/80 dark:text-rose-300/80 mb-3 leading-4">
              Deleting an assignment permanently removes its subtasks, notes, and AI summaries from your account.
            </Text>
            <TouchableOpacity
              onPress={confirmDelete}
              disabled={isBusy}
              className="w-full bg-rose-600 py-3.5 rounded-2xl items-center flex-row justify-center"
            >
              {deleteMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Trash2 size={16} color="#ffffff" />
                  <Text className="text-white font-semibold text-sm ml-2">
                    Delete Assignment
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
