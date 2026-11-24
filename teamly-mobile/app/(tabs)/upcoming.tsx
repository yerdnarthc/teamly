import React from "react";
import { View, Text } from "react-native";
import { Calendar } from "lucide-react-native";

export default function UpcomingScreen() {
  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 justify-center items-center px-6">
      <View className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-2xl justify-center items-center mb-4">
        <Calendar size={32} color="#2563eb" />
      </View>
      <Text className="text-xl font-bold text-slate-800 dark:text-white mb-1">
        Upcoming Deadlines
      </Text>
      <Text className="text-slate-500 text-center text-sm max-w-xs">
        Assignments scheduled within the next 7 days will be prioritized here.
      </Text>
    </View>
  );
}
