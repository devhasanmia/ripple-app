import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { User } from "@/types";

interface ExploreTabProps {
  filteredUsers: User[];
  onlineStatus: Record<string, boolean>;
  handleSendRequest: (userId: string) => void;
}

export function ExploreTab({
  filteredUsers,
  onlineStatus,
  handleSendRequest,
}: ExploreTabProps) {
  if (filteredUsers.length === 0) {
    return (
      <View className="flex-1 justify-center items-center px-4">
        <Ionicons name="compass-outline" size={48} color="#94a3b8" />
        <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-4 text-center">
          No users found to explore.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredUsers}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
      renderItem={({ item }) => (
        <View className="flex-row items-center p-3.5 bg-white dark:bg-slate-900 rounded-2xl mb-3">
          <View className="relative mr-3.5">
            <Image source={{ uri: item.avatar }} style={{ width: 46, height: 46, borderRadius: 23 }} />
            {onlineStatus[item.id] && (
              <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-1.5 border-white dark:border-slate-900" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-[14.5px] font-bold text-slate-800 dark:text-slate-100">{item.name}</Text>
            <Text className="text-xs text-slate-400 mt-0.5">@{item.username}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSendRequest(item.id)}
            className="bg-purple-100 dark:bg-purple-950 px-4 py-2 rounded-full"
          >
            <Text className="text-xs font-bold text-[#a133b2] dark:text-purple-300">Request</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}
