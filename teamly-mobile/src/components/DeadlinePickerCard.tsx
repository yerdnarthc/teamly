import React, { useState } from "react";
import { View, Text, TouchableOpacity, Switch, Platform } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Calendar, Clock, ChevronRight } from "lucide-react-native";

interface DeadlinePickerCardProps {
  hasDeadline: boolean;
  onToggleDeadline: (enabled: boolean) => void;
  value: Date;
  onChange: (nextDate: Date) => void;
  isDark: boolean;
}

function getDefaultTomorrowNight(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 0, 0);
  return d;
}

function isSameCalendarDay(a: Date, daysFromToday: number): boolean {
  const target = new Date();
  target.setDate(target.getDate() + daysFromToday);
  return (
    a.getFullYear() === target.getFullYear() &&
    a.getMonth() === target.getMonth() &&
    a.getDate() === target.getDate()
  );
}

/**
 * Cross-platform Date & Time Picker card backed by native Android/iOS pickers.
 */
export function DeadlinePickerCard({
  hasDeadline,
  onToggleDeadline,
  value,
  onChange,
  isDark,
}: DeadlinePickerCardProps) {
  const [activeMode, setActiveMode] = useState<"date" | "time" | null>(null);

  const handleToggle = (enabled: boolean) => {
    setActiveMode(null);
    onToggleDeadline(enabled);
    if (enabled && Number.isNaN(value.getTime())) {
      onChange(getDefaultTomorrowNight());
    }
  };

  const applyQuickPreset = (daysFromToday: number) => {
    const next = new Date();
    next.setDate(next.getDate() + daysFromToday);
    next.setHours(23, 59, 0, 0);
    onToggleDeadline(true);
    onChange(next);
    setActiveMode(null);
  };

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setActiveMode(null);
    }

    if (event.type === "dismissed" || !selected) {
      return;
    }

    const updated = new Date(value);
    if (activeMode === "date") {
      updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    } else if (activeMode === "time") {
      updated.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    }
    onChange(updated);
  };

  const formattedDate = value.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = value.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <View className="bg-white dark:bg-slate-800 p-4 rounded-none border border-slate-200 dark:border-slate-700 mb-5">
      {/* Header & Toggle */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Calendar size={18} color={isDark ? "#60a5fa" : "#2563eb"} />
          <Text className="text-sm font-bold text-slate-900 dark:text-white ml-2">
            Due Date & Time
          </Text>
        </View>
        <Switch
          value={hasDeadline}
          onValueChange={handleToggle}
          trackColor={{ false: "#cbd5e1", true: "#2563eb" }}
          thumbColor="#ffffff"
        />
      </View>

      {hasDeadline ? (
        <>
          {/* Quick Date Presets */}
          <View className="flex-row flex-wrap gap-2 mb-3.5">
            {[
              { label: "Today", days: 0 },
              { label: "Tomorrow", days: 1 },
              { label: "+3 Days", days: 3 },
              { label: "+1 Week", days: 7 },
            ].map((preset) => {
              const isPresetActive = isSameCalendarDay(value, preset.days);
              return (
                <TouchableOpacity
                  key={preset.label}
                  onPress={() => applyQuickPreset(preset.days)}
                  className={`px-3 py-1.5 rounded-none border ${
                    isPresetActive
                      ? "bg-brand-600 border-brand-600"
                      : "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isPresetActive ? "text-white" : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Interactive Date & Time Tap Buttons */}
          <View className="gap-2.5">
            <TouchableOpacity
              onPress={() => setActiveMode(activeMode === "date" ? null : "date")}
              accessibilityLabel="Select due date"
              className={`flex-row items-center justify-between px-3.5 py-3 rounded-none border ${
                activeMode === "date"
                  ? "bg-brand-50 dark:bg-brand-950/60 border-brand-500 dark:border-brand-500"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              }`}
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-none bg-blue-100 dark:bg-blue-950/70 justify-center items-center mr-3">
                  <Calendar size={16} color={isDark ? "#60a5fa" : "#2563eb"} />
                </View>
                <View>
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Due Date
                  </Text>
                  <Text className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {formattedDate}
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveMode(activeMode === "time" ? null : "time")}
              accessibilityLabel="Select due time"
              className={`flex-row items-center justify-between px-3.5 py-3 rounded-none border ${
                activeMode === "time"
                  ? "bg-brand-50 dark:bg-brand-950/60 border-brand-500 dark:border-brand-500"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              }`}
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-none bg-indigo-100 dark:bg-indigo-950/70 justify-center items-center mr-3">
                  <Clock size={16} color={isDark ? "#818cf8" : "#4f46e5"} />
                </View>
                <View>
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Due Time
                  </Text>
                  <Text className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {formattedTime}
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Native Platform Picker */}
          {activeMode !== null && (
            <View className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <DateTimePicker
                value={value}
                mode={activeMode}
                display={
                  Platform.OS === "ios"
                    ? activeMode === "date"
                      ? "inline"
                      : "spinner"
                    : "default"
                }
                is24Hour={false}
                themeVariant={isDark ? "dark" : "light"}
                accentColor="#2563eb"
                onChange={handlePickerChange}
              />

              {Platform.OS === "ios" && (
                <TouchableOpacity
                  onPress={() => setActiveMode(null)}
                  className="mt-2 py-2.5 rounded-none bg-brand-600 items-center"
                >
                  <Text className="text-white font-semibold text-xs">Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      ) : (
        <Text className="text-xs text-slate-500 dark:text-slate-400">
          No deadline set. Toggle on to pick a due date and time.
        </Text>
      )}
    </View>
  );
}
