import { BackgroundBlobs } from "@/components/background-blobs";
import { Ionicons } from "@expo/vector-icons";
import { ColorSchemeName, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface WelcomeScreenProps {
  colorScheme: ColorSchemeName;
  handleLayout: (e: any) => void;
  onEnterAuth: () => void;
  onEnterDemoMode: () => void;
}

export function WelcomeScreen({
  colorScheme,
  handleLayout,
  onEnterAuth,
  onEnterDemoMode,
}: WelcomeScreenProps) {
  const isDark = colorScheme === "dark";

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#020617" : "#ffffff" }} onLayout={handleLayout}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView className="flex-1 justify-between items-center px-6 py-8" edges={["top", "bottom"]}>

        {/* Background blobs for premium depth */}
        <BackgroundBlobs />

        {/* Top Space Holder */}
        <View />

        {/* Center Logo & Branding */}
        <View className="items-center z-10">
          <View className="w-28 h-28 rounded-full bg-purple-100 dark:bg-purple-950/30 items-center justify-center mb-6 shadow-xl shadow-purple-500/10">
            <View className="w-20 h-20 rounded-full bg-[#a133b2] items-center justify-center shadow-lg shadow-purple-500/60">
              <Ionicons name="chatbubble-ellipses" size={40} color="#ffffff" style={{ transform: [{ scaleX: -1 }] }} />
            </View>
          </View>
          <Text className="text-5xl font-black text-[#a133b2] dark:text-purple-400 tracking-tighter">
            Ripple
          </Text>
          <View className="flex-row items-center gap-1.5 mt-2">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <Text className="text-xs text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">
              Premium Secure Messaging
            </Text>
          </View>
        </View>

        {/* Bottom Card Actions */}
        <View className="w-full bg-white dark:bg-slate-900 p-7 rounded-[32px] gap-5 mb-6 shadow-2xl shadow-slate-200/30 dark:shadow-slate-950/85 z-10">
          <View className="items-center">
            <Text className="text-xl font-bold text-slate-850 dark:text-slate-100 text-center">
              Welcome to Ripple!
            </Text>
            <Text className="text-xs text-slate-400 dark:text-slate-400 text-center leading-5 mt-2">
              Connect with teammates in real-time or explore our feature-rich interface in Demo Mode.
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="gap-3 mt-2">
            {/* Login / Register */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onEnterAuth}
              className="bg-[#a133b2] py-4 rounded-2xl items-center flex-row justify-center gap-2 shadow-lg shadow-purple-500/30"
            >
              <Ionicons name="log-in-outline" size={18} color="#ffffff" />
              <Text className="text-white font-bold text-sm">
                Login / Register
              </Text>
            </TouchableOpacity>

            {/* Explore Demo Mode */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onEnterDemoMode}
              className="bg-slate-100 dark:bg-slate-800/80 py-4 rounded-2xl items-center flex-row justify-center gap-2"
            >
              <Ionicons name="compass-outline" size={18} color="#a133b2" className="dark:text-purple-400" />
              <Text className="text-[#a133b2] dark:text-purple-400 font-bold text-sm">
                Explore Demo Mode
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Info */}
        <Text className="text-[10px] text-slate-400 dark:text-slate-600 font-extrabold tracking-wider uppercase z-10">
          Ripple Messenger v1.0.0
        </Text>
      </SafeAreaView>
    </View>
  );
}
