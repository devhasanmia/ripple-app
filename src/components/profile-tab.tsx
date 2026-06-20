import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  FlatList,
  Platform
} from "react-native";
import { Image } from "expo-image";
import { Feather, Ionicons } from "@expo/vector-icons";

interface ProfileTabProps {
  editName: string;
  setEditName: (s: string) => void;
  editUsername: string;
  setEditUsername: (s: string) => void;
  editPin: string;
  setEditPin: (s: string) => void;
  showPin: boolean;
  setShowPin: (b: boolean) => void;
  editAvatarUri: string | null;
  handlePickAvatar: () => void;
  profileMessage: { text: string; type: "success" | "error" | "" };
  profileUpdating: boolean;
  handleSaveProfile: () => void;
  setRealActiveTab: (s: "chats" | "explore" | "requests" | "profile") => void;
  handleLogout: () => void;
  androidKeyboardPadding: number;
  isDark: boolean;
}

export function ProfileTab({
  editName,
  setEditName,
  editUsername,
  setEditUsername,
  editPin,
  setEditPin,
  showPin,
  setShowPin,
  editAvatarUri,
  handlePickAvatar,
  profileMessage,
  profileUpdating,
  handleSaveProfile,
  setRealActiveTab,
  handleLogout,
  androidKeyboardPadding,
  isDark,
}: ProfileTabProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, paddingBottom: Platform.OS === "android" ? androidKeyboardPadding : 0 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 140 : 0}
    >
      <FlatList
        data={[{ id: "profile-form" }]}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={() => (
          <View className="gap-6 mt-2">
            {/* Centered Avatar Edit */}
            <View className="items-center">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePickAvatar}
                style={{ position: "relative" }}
              >
                <View
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 55,
                    borderWidth: 3,
                    borderColor: "#a133b2",
                    padding: 3,
                    backgroundColor: "#f8fafc",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    elevation: 3,
                  }}
                  className="dark:bg-slate-900 justify-center items-center"
                >
                  <Image
                    source={{ uri: editAvatarUri || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" }}
                    style={{ width: "100%", height: "100%", borderRadius: 50 }}
                  />
                </View>
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    backgroundColor: "#a133b2",
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: "#ffffff",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15,
                    shadowRadius: 1.5,
                    elevation: 2,
                  }}
                >
                  <Feather name="camera" size={14} color="#ffffff" />
                </View>
              </TouchableOpacity>
              <Text className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-3">
                Tap photo to change
              </Text>
            </View>

            {/* Status Message */}
            {profileMessage.text ? (
              <View
                className={`p-3.5 rounded-xl border items-center ${profileMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-955 dark:border-emerald-900"
                  : "bg-red-50 border-red-200 dark:bg-red-955 dark:border-red-900"
                  }`}
              >
                <Text
                  className={`text-xs font-bold text-center ${profileMessage.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                    }`}
                >
                  {profileMessage.text}
                </Text>
              </View>
            ) : null}

            {/* Form Fields Container */}
            <View className="bg-[#f8fafc] dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 gap-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
              {/* Name field */}
              <View className="gap-1.5">
                <Text className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                  Full Name
                </Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Full Name"
                  placeholderTextColor="#94a3b8"
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-semibold"
                />
              </View>

              {/* Username field */}
              <View className="gap-1.5">
                <Text className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                  Username
                </Text>
                <TextInput
                  value={editUsername}
                  onChangeText={setEditUsername}
                  autoCapitalize="none"
                  placeholder="username"
                  placeholderTextColor="#94a3b8"
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-semibold"
                />
              </View>

              {/* Security PIN field */}
              <View className="gap-1.5">
                <Text className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                  Security PIN
                </Text>
                <View style={{ position: "relative" }} className="justify-center">
                  <TextInput
                    value={editPin}
                    onChangeText={setEditPin}
                    secureTextEntry={!showPin}
                    keyboardType="numeric"
                    placeholder="PIN"
                    placeholderTextColor="#94a3b8"
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-4 pr-12 py-3 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-semibold"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPin(!showPin)}
                    style={{ position: "absolute", right: 12, padding: 4 }}
                  >
                    <Ionicons
                      name={showPin ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-3">
              {/* Save Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSaveProfile}
                disabled={profileUpdating}
                className="bg-[#a133b2] py-3.5 rounded-2xl items-center"
                style={{ shadowColor: "#a133b2", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 }}
              >
                <Text className="text-white font-bold text-sm">
                  {profileUpdating ? "Saving Changes..." : "Save Changes"}
                </Text>
              </TouchableOpacity>

              {/* Cancel / Back to Chats */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setRealActiveTab("chats")}
                className="bg-transparent py-3.5 rounded-2xl items-center border border-slate-200 dark:border-slate-800"
              >
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                  Back to Chats
                </Text>
              </TouchableOpacity>

              {/* Logout */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleLogout}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: "#fff1f2",
                  borderWidth: 1,
                  borderColor: "#fecdd3",
                  paddingVertical: 14,
                  borderRadius: 16,
                }}
              >
                <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                <Text style={{ color: "#ef4444", fontWeight: "800", fontSize: 14 }}>
                  Log Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}
