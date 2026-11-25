import React, { useMemo, useState } from "react";
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
  Sparkles,
  Clock,
  Plus,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Brain,
  Zap,
  CheckCircle2,
  X,
} from "lucide-react-native";
import { apiClient } from "../../src/services/apiClient";
import { useCoalescedMutation } from "../../src/hooks/useCoalescedMutation";
import { useThemeStore } from "../../src/stores/themeStore";

interface SubjectBrief {
  id: number;
  name: string;
  color: string;
}

interface WorkspaceAssignment {
  id: number;
  title: string;
  due_at: string | null;
  status: { id: number; code: string; label: string };
  priority: { id: number; code: string; rank: number };
  subject: SubjectBrief | null;
  subtask_count: number;
  completed_subtask_count: number;
}

interface WorkspaceSummaryItem {
  id: number;
  assignment: WorkspaceAssignment;
  summary: string;
  requirements: string[];
  suggested_subtasks: string[];
  adopted_titles: string[];
  complexity: "Light" | "Moderate" | "High";
  estimated_minutes: number;
  study_tip: string;
  model: string;
  user_rating: "UP" | "DOWN" | null;
  created_at: string;
}

interface WorkspaceInsights {
  analyzed_count: number;
  pending_analysis_count: number;
  total_suggested_tasks: number;
  estimated_total_minutes: number;
  complexity_level: "Light" | "Balanced" | "Heavy";
  study_recommendation: string;
}

interface AssistantWorkspaceResponse {
  workspace_insights: WorkspaceInsights;
  summaries: WorkspaceSummaryItem[];
  unanalyzed_assignments: WorkspaceAssignment[];
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export default function AiAssistantWorkspaceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colorScheme } = useColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const isDark = colorScheme === "dark" || theme === "DARK";

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [adoptingKey, setAdoptingKey] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [recentlyAnalyzedId, setRecentlyAnalyzedId] = useState<number | null>(null);

  const showFeedbackToast = (msg: string) => {
    setFeedbackToast(msg);
  };

  React.useEffect(() => {
    if (!feedbackToast) return;
    const timer = setTimeout(() => setFeedbackToast(null), 5000);
    return () => clearTimeout(timer);
  }, [feedbackToast]);

  React.useEffect(() => {
    if (recentlyAnalyzedId === null) return;
    const timer = setTimeout(() => setRecentlyAnalyzedId(null), 6000);
    return () => clearTimeout(timer);
  }, [recentlyAnalyzedId]);

  const {
    data: workspace,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<AssistantWorkspaceResponse>({
    queryKey: ["ai-workspace"],
    queryFn: async () => {
      const res = await apiClient.get("/assistant/");
      return res.data;
    },
  });

  const analyzeAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/assistant/analyze-all/");
      return res.data as { analyzed_count: number; message: string };
    },
    onSuccess: async (report) => {
      await queryClient.invalidateQueries({ queryKey: ["ai-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setSelectedSubjectId(null);
      showFeedbackToast(
        report.message || `Analyzed ${report.analyzed_count} assignment(s).`
      );
    },
    onError: () => {
      Alert.alert("Analysis Failed", "Could not analyze pending assignments.");
    },
  });

  const analyzeOneMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      setAnalyzingId(assignmentId);
      const res = await apiClient.post<WorkspaceSummaryItem>(
        `/assistant/analyze/${assignmentId}/`
      );
      return res.data;
    },
    onSuccess: async (createdSummary, assignmentId) => {
      await queryClient.invalidateQueries({ queryKey: ["ai-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["assignment", String(assignmentId)] });
      if (
        selectedSubjectId !== null &&
        createdSummary?.assignment?.subject?.id !== selectedSubjectId
      ) {
        setSelectedSubjectId(null);
      }
      if (createdSummary?.id) {
        setRecentlyAnalyzedId(createdSummary.id);
      }
      showFeedbackToast(
        `AI breakdown ready for "${createdSummary?.assignment?.title || "assignment"}".`
      );
    },
    onError: () => {
      Alert.alert("Analysis Failed", "Could not generate AI breakdown.");
    },
    onSettled: () => setAnalyzingId(null),
  });

  const adoptSubtaskMutation = useMutation({
    mutationFn: async ({
      assignmentId,
      title,
    }: {
      assignmentId: number;
      title: string;
    }) => {
      await apiClient.post(`/assignments/${assignmentId}/adopt-subtask/`, { title });
    },
    onMutate: async ({ assignmentId, title }) => {
      await queryClient.cancelQueries({ queryKey: ["ai-workspace"] });
      const previous = queryClient.getQueryData<AssistantWorkspaceResponse>(["ai-workspace"]);
      if (previous) {
        const normalized = title.trim().toLowerCase();
        queryClient.setQueryData<AssistantWorkspaceResponse>(["ai-workspace"], {
          ...previous,
          summaries: previous.summaries.map((s) => {
            if (s.assignment.id !== assignmentId) return s;
            const alreadyAdopted = s.adopted_titles.some(
              (t) => t.trim().toLowerCase() === normalized
            );
            return {
              ...s,
              adopted_titles: alreadyAdopted ? s.adopted_titles : [...s.adopted_titles, title],
              assignment: {
                ...s.assignment,
                subtask_count: alreadyAdopted
                  ? s.assignment.subtask_count
                  : s.assignment.subtask_count + 1,
              },
            };
          }),
        });
      }
      showFeedbackToast(`Added "${title}" to your checklist.`);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["ai-workspace"], context.previous);
      }
      setFeedbackToast(null);
      Alert.alert("Adoption Failed", "Could not adopt suggested subtask.");
    },
    onSettled: (_data, _err, vars) => {
      setAdoptingKey(null);
      queryClient.invalidateQueries({ queryKey: ["ai-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["assignment", String(vars.assignmentId)] });
    },
  });

  const feedbackCoalesced = useCoalescedMutation<
    AssistantWorkspaceResponse,
    Record<number, "UP" | "DOWN">,
    void
  >({
    queryKey: ["ai-workspace"],
    mutationKey: ["ai-workspace-feedback"],
    debounceMs: 350,
    mutationFn: async (ratingsMap, signal) => {
      await Promise.all(
        Object.entries(ratingsMap).map(([summaryId, rating]) =>
          apiClient.post(
            `/assistant/summaries/${summaryId}/feedback/`,
            { rating },
            { signal }
          )
        )
      );
    },
    applyOptimistic: (current, ratingsMap) => ({
      ...current,
      summaries: current.summaries.map((s) =>
        ratingsMap[s.id] ? { ...s, user_rating: ratingsMap[s.id] } : s
      ),
    }),
    isNoOp: (confirmed, next) =>
      confirmed.summaries.every((s, idx) => s.user_rating === next.summaries[idx]?.user_rating),
    onSuccess: () => {
      showFeedbackToast("Feedback saved. Thank you!");
    },
    onError: () => {
      setFeedbackToast(null);
      Alert.alert("Feedback Failed", "Could not save your rating.");
    },
  });

  const uniqueSubjects = useMemo(() => {
    const map = new Map<number, SubjectBrief>();
    workspace?.summaries.forEach((s) => {
      if (s.assignment.subject) {
        map.set(s.assignment.subject.id, s.assignment.subject);
      }
    });
    return Array.from(map.values());
  }, [workspace?.summaries]);

  const filteredSummaries = useMemo(() => {
    if (!workspace?.summaries) return [];
    if (selectedSubjectId === null) return workspace.summaries;
    return workspace.summaries.filter(
      (s) => s.assignment.subject?.id === selectedSubjectId
    );
  }, [workspace?.summaries, selectedSubjectId]);

  if (isLoading) {
    return (
      <SafeAreaView
        edges={["left", "right"]}
        className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900"
      >
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-3">
          Preparing AI study insights...
        </Text>
      </SafeAreaView>
    );
  }

  const insights = workspace?.workspace_insights;
  const unanalyzed = workspace?.unanalyzed_assignments || [];

  return (
    <SafeAreaView
      edges={["left", "right"]}
      className="flex-1 bg-slate-50 dark:bg-slate-900"
    >
      {/* Confirmation Feedback Banner (pinned at top so it's always visible regardless of scroll) */}
      {feedbackToast && (
        <View className="mx-5 mt-3 mb-1 flex-row items-center justify-between bg-emerald-50 dark:bg-emerald-950/80 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800">
          <View className="flex-row items-center flex-1 mr-2">
            <CheckCircle2 size={18} color="#10b981" />
            <Text className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 ml-2.5 flex-1 leading-4">
              {feedbackToast}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setFeedbackToast(null)}
            accessibilityLabel="Dismiss notification"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={15} color="#10b981" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        className="flex-1 px-5 pt-3"
        contentContainerStyle={{ paddingBottom: 100 }}
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
        {/* Insights Hero Card */}
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 justify-center items-center mr-2.5">
                <Brain size={18} color={isDark ? "#60a5fa" : "#2563eb"} />
              </View>
              <View>
                <Text className="text-base font-bold text-slate-900 dark:text-white">
                  Workload & Study Advisor
                </Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cross-course AI breakdown
                </Text>
              </View>
            </View>

            {insights && (
              <View
                className={`px-2.5 py-1 rounded-full ${
                  insights.complexity_level === "Heavy"
                    ? "bg-rose-100 dark:bg-rose-950/60"
                    : insights.complexity_level === "Balanced"
                    ? "bg-amber-100 dark:bg-amber-950/60"
                    : "bg-emerald-100 dark:bg-emerald-950/60"
                }`}
              >
                <Text
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    insights.complexity_level === "Heavy"
                      ? "text-rose-700 dark:text-rose-300"
                      : insights.complexity_level === "Balanced"
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-emerald-700 dark:text-emerald-300"
                  }`}
                >
                  {insights.complexity_level}
                </Text>
              </View>
            )}
          </View>

          {/* Metrics Row */}
          <View className="flex-row gap-2.5 mb-3.5">
            <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Est. Study
              </Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {formatDuration(insights?.estimated_total_minutes ?? 0)}
              </Text>
            </View>
            <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Analyzed
              </Text>
              <Text className="text-lg font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                {insights?.analyzed_count ?? 0}
              </Text>
            </View>
            <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pending AI
              </Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {insights?.pending_analysis_count ?? 0}
              </Text>
            </View>
          </View>

          {/* Study Recommendation Banner */}
          <View className="bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800/70 rounded-2xl p-3.5">
            <Text className="text-xs text-slate-700 dark:text-slate-200 leading-5">
              {insights?.study_recommendation}
            </Text>
          </View>

          {unanalyzed.length > 0 && (
            <TouchableOpacity
              onPress={() => analyzeAllMutation.mutate()}
              disabled={analyzeAllMutation.isPending}
              className="mt-3.5 w-full bg-brand-600 py-3 rounded-2xl flex-row items-center justify-center"
            >
              {analyzeAllMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Sparkles size={16} color="#ffffff" />
                  <Text className="text-white font-semibold text-sm ml-2">
                    Analyze All Active ({unanalyzed.length})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Pending Assignments Awaiting AI Analysis */}
        {unanalyzed.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-2.5">
              <Zap size={15} color={isDark ? "#fbbf24" : "#d97706"} />
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1.5">
                Ready for AI Breakdown ({unanalyzed.length})
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {unanalyzed.map((item) => {
                const isBusy = analyzingId === item.id;
                return (
                  <View
                    key={item.id}
                    className="w-60 bg-white dark:bg-slate-800 rounded-2xl p-3.5 mr-3 border border-slate-200 dark:border-slate-700 justify-between"
                  >
                    <View>
                      {item.subject && (
                        <Text
                          className="text-[11px] font-bold mb-1"
                          style={{ color: item.subject.color || "#3b82f6" }}
                          numberOfLines={1}
                        >
                          {item.subject.name}
                        </Text>
                      )}
                      <Text
                        className="text-sm font-bold text-slate-900 dark:text-white mb-3"
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => analyzeOneMutation.mutate(item.id)}
                      disabled={isBusy}
                      className="bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 py-2 rounded-xl flex-row items-center justify-center"
                    >
                      {isBusy ? (
                        <ActivityIndicator
                          size="small"
                          color={isDark ? "#93c5fd" : "#2563eb"}
                        />
                      ) : (
                        <>
                          <Sparkles
                            size={14}
                            color={isDark ? "#93c5fd" : "#2563eb"}
                          />
                          <Text className="text-xs font-semibold text-brand-700 dark:text-brand-300 ml-1.5">
                            Analyze
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Course Filter Chips */}
        {uniqueSubjects.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <TouchableOpacity
              onPress={() => setSelectedSubjectId(null)}
              className={`mr-2 px-3.5 py-2 rounded-2xl border ${
                selectedSubjectId === null
                  ? "bg-brand-600 border-brand-600"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedSubjectId === null
                    ? "text-white"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                All Courses
              </Text>
            </TouchableOpacity>

            {uniqueSubjects.map((sub) => {
              const isSelected = selectedSubjectId === sub.id;
              return (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() =>
                    setSelectedSubjectId(isSelected ? null : sub.id)
                  }
                  className={`mr-2 px-3.5 py-2 rounded-2xl border flex-row items-center ${
                    isSelected
                      ? "bg-brand-600 border-brand-600"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <View
                    className="w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: sub.color || "#3b82f6" }}
                  />
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected
                        ? "text-white"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Analyzed Coursework Summaries */}
        {filteredSummaries.length > 0 ? (
          filteredSummaries.map((item) => {
            const adoptedSet = new Set(item.adopted_titles);
            const subjectColor = item.assignment.subject?.color || "#3b82f6";
            const isRecent = recentlyAnalyzedId === item.id;

            return (
              <View
                key={item.id}
                className={`bg-white dark:bg-slate-800 rounded-3xl p-5 mb-4 border ${
                  isRecent
                    ? "border-emerald-400 dark:border-emerald-500"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                {isRecent && (
                  <View className="flex-row items-center mb-2">
                    <View className="bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex-row items-center">
                      <Sparkles size={11} color="#10b981" />
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 ml-1">
                        Just Analyzed
                      </Text>
                    </View>
                  </View>
                )}
                {/* Top Metadata Row: Course Pill (truncated) + Priority/Status */}
                <View className="flex-row items-center justify-between mb-2.5">
                  <View className="flex-1 mr-2">
                    {item.assignment.subject ? (
                      <View
                        className="px-2.5 py-1 rounded-full flex-row items-center self-start max-w-full"
                        style={{ backgroundColor: `${subjectColor}18` }}
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
                          {item.assignment.subject.name}
                        </Text>
                      </View>
                    ) : (
                      <View className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full self-start">
                        <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          General
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full flex-shrink-0">
                    <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {item.assignment.status.label}
                    </Text>
                  </View>
                </View>

                {/* Assignment Title Link */}
                <TouchableOpacity
                  onPress={() => router.push(`/assignment/${item.assignment.id}`)}
                  className="flex-row items-center justify-between mb-2"
                >
                  <Text
                    className="text-base font-bold text-slate-900 dark:text-white flex-1 mr-2"
                    numberOfLines={2}
                  >
                    {item.assignment.title}
                  </Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </TouchableOpacity>

                {/* AI Summary & Study Tip */}
                <Text className="text-xs text-slate-600 dark:text-slate-300 leading-5 mb-2">
                  {item.summary}
                </Text>
                <Text className="text-[11px] font-medium text-brand-700 dark:text-brand-300 mb-3">
                  Tip: {item.study_tip}
                </Text>

                {/* Dedicated Study Effort Metadata Row */}
                <View className="flex-row items-center flex-wrap gap-2 mb-3">
                  <View className="flex-row items-center bg-slate-100 dark:bg-slate-700/80 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-600">
                    <Clock size={12} color={isDark ? "#94a3b8" : "#64748b"} />
                    <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200 ml-1.5">
                      ~{formatDuration(item.estimated_minutes)} · {item.complexity}
                    </Text>
                  </View>

                  <View className="bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-xl">
                    <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {item.assignment.completed_subtask_count}/{item.assignment.subtask_count} subtasks done
                    </Text>
                  </View>
                </View>

                {/* Suggested Subtasks */}
                {item.suggested_subtasks.length > 0 && (
                  <View className="pt-3 border-t border-slate-100 dark:border-slate-700">
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Suggested Study Tasks
                    </Text>

                    {item.suggested_subtasks.slice(0, 4).map((suggestion, idx) => {
                      const isAdopted = adoptedSet.has(
                        suggestion.toLowerCase().trim()
                      );
                      const isAdopting =
                        adoptingKey === `${item.assignment.id}:${suggestion}`;

                      return (
                        <View
                          key={idx}
                          className="flex-row items-center justify-between py-1.5"
                        >
                          <Text
                            className="text-xs text-slate-700 dark:text-slate-300 flex-1 mr-2"
                            numberOfLines={2}
                          >
                            • {suggestion}
                          </Text>

                          {isAdopted ? (
                            <View className="flex-row items-center bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 size={12} color="#10b981" />
                              <Text className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 ml-1">
                                Added
                              </Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() =>
                                adoptSubtaskMutation.mutate({
                                  assignmentId: item.assignment.id,
                                  title: suggestion,
                                })
                              }
                              disabled={isAdopting}
                              className="bg-brand-600 px-2.5 py-1 rounded-full flex-row items-center"
                            >
                              {isAdopting ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                              ) : (
                                <>
                                  <Plus size={12} color="#ffffff" />
                                  <Text className="text-[11px] font-semibold text-white ml-0.5">
                                    Adopt
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Feedback Footer */}
                <View className="flex-row items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-700/70">
                  <Text className="text-[11px] text-slate-400">
                    Was this breakdown helpful?
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => feedbackCoalesced.trigger({ [item.id]: "UP" })}
                      accessibilityLabel="Mark AI summary helpful"
                      className={`px-2.5 py-1.5 rounded-xl border flex-row items-center ${
                        item.user_rating === "UP"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-400"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <ThumbsUp
                        size={13}
                        color={
                          item.user_rating === "UP" ? "#10b981" : "#94a3b8"
                        }
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => feedbackCoalesced.trigger({ [item.id]: "DOWN" })}
                      accessibilityLabel="Mark AI summary not helpful"
                      className={`px-2.5 py-1.5 rounded-xl border flex-row items-center ${
                        item.user_rating === "DOWN"
                          ? "bg-rose-100 dark:bg-rose-950/60 border-rose-400"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <ThumbsDown
                        size={13}
                        color={
                          item.user_rating === "DOWN" ? "#e11d48" : "#94a3b8"
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 items-center">
            <Sparkles size={40} color="#94a3b8" />
            <Text className="text-base font-bold text-slate-800 dark:text-white mt-3 text-center">
              No AI Breakdowns Yet
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1 leading-5">
              Analyze an assignment above or open any assignment detail screen to generate AI study suggestions.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
