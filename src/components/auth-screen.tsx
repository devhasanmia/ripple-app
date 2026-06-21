import { BackgroundBlobs } from "@/components/background-blobs";
import { Ionicons } from "@expo/vector-icons";
import {
  ColorSchemeName,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AuthScreenProps {
  authScreen: "login" | "register";
  setAuthScreen: (screen: "login" | "register") => void;
  formName: string;
  setFormName: (text: string) => void;
  formUsername: string;
  setFormUsername: (text: string) => void;
  formPin: string;
  setFormPin: (text: string) => void;
  authError: string;
  setAuthError: (text: string) => void;
  onSubmit: (optUsername?: string, optPin?: string) => void;
  onCancel: () => void;
  colorScheme: ColorSchemeName;
  handleLayout: (e: any) => void;
  androidKeyboardPadding: number;
}

export function AuthScreen({
  authScreen,
  setAuthScreen,
  formName,
  setFormName,
  formUsername,
  setFormUsername,
  formPin,
  setFormPin,
  authError,
  setAuthError,
  onSubmit,
  onCancel,
  colorScheme,
  handleLayout,
  androidKeyboardPadding,
}: AuthScreenProps) {
  const isDark = colorScheme === "dark";

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#020617" : "#ffffff" }} onLayout={handleLayout}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#020617" : "#ffffff"}
        translucent={false}
      />
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top", "bottom", "left", "right"]}>

        {/* Background depth blobs */}
        <BackgroundBlobs />

        {/* Fixed Top Navigation Row */}
        <View className="flex-row items-center px-6 py-3 z-20">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onCancel}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 justify-center items-center"
          >
            <Ionicons name="arrow-back" size={22} color={isDark ? "#f8fafc" : "#1e293b"} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, paddingBottom: Platform.OS === "android" ? androidKeyboardPadding : 0 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              paddingHorizontal: 24,
              paddingVertical: 20,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Welcome text */}
            <View className="mb-8 items-center z-10">
              <View className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/40 items-center justify-center mb-4">
                <Ionicons name={authScreen === "login" ? "lock-open" : "person-add"} size={28} color="#a133b2" />
              </View>
              <Text className="text-2xl font-black text-[#a133b2] dark:text-purple-400 tracking-tighter">
                {authScreen === "login" ? "Welcome Back" : "Create Account"}
              </Text>
              <Text className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mt-1">
                {authScreen === "login" ? "Sign in to connect securely" : "Register to start messaging"}
              </Text>
            </View>

            {/* Form Card (Borderless with clean flat design) */}
            <View
              className="bg-slate-50/50 dark:bg-slate-900/60 p-6 rounded-[32px] gap-5 z-10"
            >
              {authError ? (
                <View className="bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200/60 dark:border-red-900/40 flex-row items-center gap-2">
                  <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                  <Text className="text-xs text-red-500 font-bold flex-1">
                    {authError}
                  </Text>
                </View>
              ) : null}

              {/* Full Name (Registration only) */}
              {authScreen === "register" && (
                <View className="gap-1.5">
                  <Text className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                    Full Name
                  </Text>
                  <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <Ionicons name="person-outline" size={16} color="#94a3b8" style={{ marginRight: 10 }} />
                    <TextInput
                      value={formName}
                      onChangeText={setFormName}
                      placeholder="Enter full name"
                      placeholderTextColor="#94a3b8"
                      className="flex-1 text-slate-800 dark:text-slate-100 text-sm font-semibold p-0"
                    />
                  </View>
                </View>
              )}

              {/* Username */}
              <View className="gap-1.5">
                <Text className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                  Username
                </Text>
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <Ionicons name="at-outline" size={16} color="#94a3b8" style={{ marginRight: 10 }} />
                  <TextInput
                    value={formUsername}
                    onChangeText={setFormUsername}
                    autoCapitalize="none"
                    placeholder="Enter username"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 text-slate-800 dark:text-slate-100 text-sm font-semibold p-0"
                  />
                </View>
              </View>

              {/* Security PIN */}
              <View className="gap-1.5">
                <Text className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                  Security PIN
                </Text>
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <Ionicons name="keypad-outline" size={16} color="#94a3b8" style={{ marginRight: 10 }} />
                  <TextInput
                    value={formPin}
                    onChangeText={setFormPin}
                    secureTextEntry
                    keyboardType="numeric"
                    placeholder="Enter 4-digit PIN"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 text-slate-800 dark:text-slate-100 text-sm font-semibold p-0"
                  />
                </View>
              </View>

              {/* Action Submit Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onSubmit()}
                className="bg-[#a133b2] py-4 rounded-2xl items-center flex-row justify-center gap-2 shadow-lg shadow-purple-500/20 mt-2"
              >
                <Text className="text-white font-bold text-sm">
                  {authScreen === "login" ? "Login" : "Sign Up"}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </TouchableOpacity>

              {/* Toggle Switch */}
              <View className="items-center mt-2">
                <TouchableOpacity
                  onPress={() => {
                    setAuthError("");
                    setAuthScreen(authScreen === "login" ? "register" : "login");
                  }}
                  className="py-1"
                >
                  <Text className="text-xs text-[#a133b2] dark:text-purple-400 font-extrabold">
                    {authScreen === "login" ? "Don't have an account? Register" : "Already have an account? Login"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quick Login options for interviewer (only shown in login screen) */}
              {authScreen === "login" && (
                <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: isDark ? "#1e293b" : "#f1f5f9", paddingTop: 20, gap: 14 }}>
                  <Text className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest text-center">
                    Quick login as interviewer:
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        setFormUsername("hasan");
                        setFormPin("4039");
                        onSubmit("hasan", "4039");
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: isDark ? "rgba(161, 51, 178, 0.1)" : "#faf5ff",
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: isDark ? "rgba(161, 51, 178, 0.25)" : "#f3e8ff",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <Ionicons name="person" size={13} color="#a133b2" />
                      <View className="items-center">
                        <Text className="text-[13.5px] font-black text-[#a133b2] dark:text-purple-300">
                          Hasan
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        setFormUsername("bashar");
                        setFormPin("1234");
                        onSubmit("bashar", "1234");
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: isDark ? "rgba(16, 185, 129, 0.1)" : "#ecfdf5",
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: isDark ? "rgba(16, 185, 129, 0.25)" : "#d1fae5",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <Ionicons name="person" size={13} color="#059669" />
                      <View className="items-center">
                        <Text className="text-[13.5px] font-black text-emerald-600 dark:text-emerald-350">
                          Bashar
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
