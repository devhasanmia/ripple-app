import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { ChatRequest } from "@/types";
import { timeAgo } from "@/utils/date";

interface RequestsTabProps {
  pendingRequests: ChatRequest[];
  sentRequests: any[];
  requestsSubTab: "incoming" | "sent";
  setRequestsSubTab: (s: "incoming" | "sent") => void;
  handleRequestResponse: (requestId: string, status: "accepted" | "declined") => void;
  handleCancelRequest: (requestId: string) => void;
  handleResendRequest: (requestId: string) => void;
}

export function RequestsTab({
  pendingRequests,
  sentRequests,
  requestsSubTab,
  setRequestsSubTab,
  handleRequestResponse,
  handleCancelRequest,
  handleResendRequest,
}: RequestsTabProps) {
  return (
    <View className="flex-1">
      {/* Segmented Selector (Borderless & Shadowless) */}
      <View className="flex-row bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4">
        <TouchableOpacity
          onPress={() => setRequestsSubTab("incoming")}
          className={`flex-1 py-2 rounded-lg items-center ${
            requestsSubTab === "incoming" ? "bg-white dark:bg-slate-900" : ""
          }`}
        >
          <Text
            className={`text-xs font-extrabold ${
              requestsSubTab === "incoming" ? "text-[#a133b2]" : "text-slate-500"
            }`}
          >
            Incoming ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setRequestsSubTab("sent")}
          className={`flex-1 py-2 rounded-lg items-center ${
            requestsSubTab === "sent" ? "bg-white dark:bg-slate-900" : ""
          }`}
        >
          <Text
            className={`text-xs font-extrabold ${
              requestsSubTab === "sent" ? "text-[#a133b2]" : "text-slate-500"
            }`}
          >
            Sent ({sentRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {requestsSubTab === "incoming" ? (
        pendingRequests.length === 0 ? (
          <View className="flex-1 justify-center items-center px-4">
            <Ionicons name="people-outline" size={48} color="#94a3b8" />
            <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-4 text-center">
              No pending chat requests.
            </Text>
          </View>
        ) : (
          <FlatList
            data={pendingRequests}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            renderItem={({ item }) => (
              <View className="flex-row items-center p-3.5 bg-white dark:bg-slate-900 rounded-2xl mb-3">
                <Image
                  source={{ uri: item.senderAvatar }}
                  style={{ width: 46, height: 46, borderRadius: 23, marginRight: 14 }}
                />
                <View className="flex-1">
                  <Text className="text-[14.5px] font-bold text-slate-800 dark:text-slate-100">
                    {item.senderName}
                  </Text>
                  {item.status === "accepted" ? (
                    <View className="flex-row items-center gap-1.5 mt-0.5">
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981" }} />
                      <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        Connected · {timeAgo(item.updatedAt)}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-xs text-slate-400 mt-0.5">wants to connect</Text>
                  )}
                </View>
                {item.status === "pending" && (
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleRequestResponse(item.id, "accepted")}
                      className="bg-emerald-100 dark:bg-emerald-955 px-3.5 py-1.5 rounded-full"
                    >
                      <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleRequestResponse(item.id, "declined")}
                      className="bg-red-100 dark:bg-red-955 px-3.5 py-1.5 rounded-full"
                    >
                      <Text className="text-xs font-bold text-red-500 dark:text-red-400">Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {item.status === "accepted" && (
                  <View className="bg-emerald-100 dark:bg-emerald-955 px-3.5 py-1.5 rounded-full">
                    <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Connected</Text>
                  </View>
                )}
              </View>
            )}
          />
        )
      ) : sentRequests.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="paper-plane-outline" size={48} color="#94a3b8" />
          <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-4 text-center">
            No requests sent yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sentRequests}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => {
            const isCancelled = item.status === "cancelled";
            const isAccepted = item.status === "accepted";
            return (
              <View
                className="flex-row items-center p-3.5 bg-white dark:bg-slate-900 rounded-2xl mb-3"
                style={isCancelled ? { opacity: 0.65 } : undefined}
              >
                <View style={{ position: "relative", marginRight: 14 }}>
                  <Image
                    source={{ uri: item.receiverAvatar }}
                    style={{ width: 46, height: 46, borderRadius: 23 }}
                  />
                  {isCancelled && (
                    <View
                      style={{
                        position: "absolute",
                        top: -2,
                        right: -2,
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: "#94a3b8",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1.5,
                        borderColor: "#ffffff",
                      }}
                    >
                      <Ionicons name="close" size={9} color="#fff" />
                    </View>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-[14.5px] font-bold text-slate-800 dark:text-slate-100">
                    {item.receiverName}
                  </Text>
                  {isAccepted ? (
                    <View className="flex-row items-center gap-1.5 mt-0.5">
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981" }} />
                      <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        Accepted · {timeAgo(item.updatedAt)}
                      </Text>
                    </View>
                  ) : isCancelled ? (
                    <Text className="text-xs text-slate-400 mt-0.5">
                      Cancelled · {timeAgo(item.updatedAt)}
                    </Text>
                  ) : (
                    <Text className="text-xs text-slate-400 mt-0.5">Pending approval</Text>
                  )}
                </View>
                {item.status === "pending" && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleCancelRequest(item.id)}
                    className="bg-red-100 dark:bg-red-955 px-3.5 py-1.5 rounded-full"
                  >
                    <Text className="text-xs font-bold text-red-500 dark:text-red-400">Cancel</Text>
                  </TouchableOpacity>
                )}
                {isCancelled && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleResendRequest(item.id)}
                    className="bg-purple-100 dark:bg-purple-955 px-3.5 py-1.5 rounded-full flex-row items-center gap-1"
                  >
                    <Ionicons name="refresh" size={11} color="#a133b2" />
                    <Text className="text-xs font-extrabold text-[#a133b2] dark:text-purple-300">Re-send</Text>
                  </TouchableOpacity>
                )}
                {isAccepted && (
                  <View className="bg-emerald-100 dark:bg-emerald-955 px-3.5 py-1.5 rounded-full">
                    <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Connected</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )
      }
    </View>
  );
}
