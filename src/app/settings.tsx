import { LoadingScreen } from "@/components/loading-screen";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackgroundBlobs } from "@/components/background-blobs";
import { ScreenHeader } from "@/components/screen-header";
import { useLoadingSimulation } from "@/hooks/use-loading-simulation";

export default function SettingsScreen() {
  const loading = useLoadingSimulation("settings", 600);
  const [activeStatus, setActiveStatus] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [dnd, setDnd] = useState(false);

  const handleAction = (title: string) => {
    Alert.alert("Settings", `Navigating to ${title} settings...`);
  };

  if (loading) {
    return <LoadingScreen message="Loading Settings..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" translucent={false} />

      <BackgroundBlobs />

      <ScrollView className="flex-1 px-4 py-4 z-10" showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Settings" subtitle="Manage your account and preferences" />

        {/* Profile Card */}
        <View className="bg-white border border-slate-100 rounded-3xl p-5 shadow-lg shadow-slate-200/20 mb-6 flex-row items-center gap-4">
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" }}
            className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200/50"
          />
          <View className="flex-1">
            <Text className="text-lg font-bold text-slate-900">
              David
            </Text>
            <Text className="text-xs text-slate-400 mt-0.5">
              david@ripple.app
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleAction("Edit Profile")}
            className="bg-indigo-50 px-3.5 py-2 rounded-full border border-indigo-100/50"
          >
            <Text className="text-xs font-bold text-indigo-600">
              Edit
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section: Status & Availability */}
        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">
          Availability Status
        </Text>
        <View className="bg-white border border-slate-100 rounded-2xl shadow-lg shadow-slate-200/20 mb-6 overflow-hidden">
          {/* Active Status */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-100/60">
            <View className="flex-1 pr-2">
              <Text className="text-[15px] font-bold text-slate-900">
                Show Active Status
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                Others can see when you're online
              </Text>
            </View>
            <Switch
              value={activeStatus}
              onValueChange={setActiveStatus}
              trackColor={{ false: "#cbd5e1", true: "#a5b4fc" }}
              thumbColor={activeStatus ? "#4f46e5" : "#f1f5f9"}
            />
          </View>

          {/* Do Not Disturb */}
          <View className="flex-row items-center justify-between px-4 py-4">
            <View className="flex-1 pr-2">
              <Text className="text-[15px] font-bold text-slate-900">
                Do Not Disturb
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                Mute calls and message sounds
              </Text>
            </View>
            <Switch
              value={dnd}
              onValueChange={setDnd}
              trackColor={{ false: "#cbd5e1", true: "#fca5a5" }}
              thumbColor={dnd ? "#dc2626" : "#f1f5f9"}
            />
          </View>
        </View>

        {/* Section: Preferences */}
        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">
          General Preferences
        </Text>
        <View className="bg-white border border-slate-100 rounded-2xl shadow-lg shadow-slate-200/20 mb-6 overflow-hidden">
          {/* Notifications Toggle */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-100/60">
            <View className="flex-1 pr-2">
              <Text className="text-[15px] font-bold text-slate-900">
                Push Notifications
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                Get notified on new messages
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#cbd5e1", true: "#a5b4fc" }}
              thumbColor={notifications ? "#4f46e5" : "#f1f5f9"}
            />
          </View>

          {/* Account Settings Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleAction("Account Settings")}
            className="flex-row items-center justify-between px-4 py-4 border-b border-slate-100/60"
          >
            <Text className="text-[15px] font-bold text-slate-900">
              Account Security & Password
            </Text>
            <Text className="text-slate-400 font-bold">➔</Text>
          </TouchableOpacity>

          {/* Chat Settings Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleAction("Chat Wallpaper")}
            className="flex-row items-center justify-between px-4 py-4"
          >
            <Text className="text-[15px] font-bold text-slate-900">
              Chat Wallpaper & Theme
            </Text>
            <Text className="text-slate-400 font-bold">➔</Text>
          </TouchableOpacity>
        </View>

        {/* Section: App Info */}
        <View className="items-center justify-center py-6">
          <Text className="text-xs text-slate-400">
            Ripple Messenger v1.0.0
          </Text>
          <Text className="text-[10px] text-slate-500 mt-0.5">
            Designed with Premium Clean Light Theme
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
