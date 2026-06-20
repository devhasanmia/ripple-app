import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  FlatList,
  TextInput,
  Platform,
  ColorSchemeName,
  Keyboard,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Feather, Ionicons } from "@expo/vector-icons";
import { TypingIndicator } from "@/components/typing-indicator";
import { User, ChatMessage } from "@/types";

const POPULAR_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌",
  "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓",
  "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖",
  "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱",
  "👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤌", "🤏", "✍️",
  "👏", "🙌", "👐", "🤲", "🤝", "🙏", "🎈", "🎉", "🔥", "✨", "💖", "❤️", "💔", "💯"
];

interface ChatRoomProps {
  activeUser: User;
  counterpartUser: User;
  currentUser: string;
  setCurrentUser: (u: string) => void;
  davidUser: User;
  loggedInUser: User | null;
  currentMode: string | null;
  activeMessages: ChatMessage[];
  renderMessageItem: ({ item, index }: { item: ChatMessage; index: number }) => React.ReactElement;
  showTypingIndicator: boolean;
  draftText: Record<string, string>;
  handleDraftChange: (text: string) => void;
  handleSend: () => void;
  toggleOnline: () => void;
  isCounterpartOnline: boolean;
  colorScheme: ColorSchemeName;
  handleLayout: (e: any) => void;
  androidKeyboardPadding: number;
  topPaddingOffset: number;
  onBack: () => void;
  flatListRef: React.RefObject<FlatList | null>;
  handlePickChatImage: () => void;
  showEmojiTray: boolean;
  setShowEmojiTray: (show: boolean) => void;
  messagesLoading?: boolean;
}

export function ChatRoom({
  activeUser,
  counterpartUser,
  currentUser,
  setCurrentUser,
  davidUser,
  loggedInUser,
  currentMode,
  activeMessages,
  renderMessageItem,
  showTypingIndicator,
  draftText,
  handleDraftChange,
  handleSend,
  toggleOnline,
  isCounterpartOnline,
  colorScheme,
  handleLayout,
  androidKeyboardPadding,
  topPaddingOffset,
  onBack,
  flatListRef,
  handlePickChatImage,
  showEmojiTray,
  setShowEmojiTray,
  messagesLoading = false,
}: ChatRoomProps) {
  const isDark = colorScheme === "dark";
  const activeSenderId = currentMode === "real" && loggedInUser ? loggedInUser.id : currentUser;
  const inputRef = React.useRef<TextInput>(null);

  const [visibleCount, setVisibleCount] = React.useState(15);

  React.useEffect(() => {
    setVisibleCount(15);
  }, [activeUser.id]);

  const slicedMessages = activeMessages.slice(-visibleCount);
  const hasMore = activeMessages.length > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 15);
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#020617" : "#ffffff", paddingTop: topPaddingOffset }} onLayout={handleLayout}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#020617" : "#ffffff"}
        translucent={false}
      />
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top", "bottom", "left", "right"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "#1e293b" : "#f1f5f9",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            {/* Back Button */}
            <TouchableOpacity activeOpacity={0.7} onPress={onBack} className="p-1 mr-3">
              <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#1e293b"} />
            </TouchableOpacity>

            {/* Avatar with status dot */}
            <View style={{ position: "relative", marginRight: 16 }}>
              <Image source={{ uri: counterpartUser.avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} />
              <View
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  width: 12,
                  height: 12,
                  backgroundColor: isCounterpartOnline ? "#10b981" : "#94a3b8",
                  borderWidth: 2,
                  borderColor: isDark ? "#020617" : "#ffffff",
                  borderRadius: 6,
                }}
              />
            </View>

            {/* Title & Status */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text className="text-base font-bold text-slate-800 dark:text-slate-100">{counterpartUser.name}</Text>

                {/* Status Toggle Switch */}
                <TouchableOpacity
                  onPress={toggleOnline}
                  className={`px-2 py-0.5 rounded-full border ${isCounterpartOnline
                    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800"
                    : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                    }`}
                >
                  <Text className={`text-[9px] font-extrabold ${isCounterpartOnline ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}`}>
                    {isCounterpartOnline ? "ONLINE" : "OFFLINE"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center mt-0.5">
                <Text className="text-xs text-slate-400 dark:text-slate-500 font-medium">{isCounterpartOnline ? "Active Now" : "Offline"}</Text>
                {isCounterpartOnline && (
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#a133b2", marginLeft: 6 }} />
                )}
              </View>
            </View>
          </View>

          {/* Custom Sender Toggle Switch (Demo mode only) */}
          {currentMode === "demo" && (
            <View style={{ alignItems: "center", gap: 3 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  const nextUser = currentUser === "me" ? activeUser.id : "me";
                  setCurrentUser(nextUser);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "#334155" : "#e2e8f0",
                  borderRadius: 18,
                  padding: 2,
                  position: "relative",
                  width: 68,
                  height: 32,
                }}
              >
                {/* Active Indicator Slider */}
                <View
                  style={{
                    position: "absolute",
                    top: 2,
                    left: currentUser === "me" ? 2 : 38,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: "#ffffff",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15,
                    shadowRadius: 1,
                    elevation: 1,
                  }}
                />
                {/* David Avatar */}
                <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", zIndex: 1, opacity: currentUser === "me" ? 1 : 0.4 }}>
                  <Image
                    source={{ uri: davidUser.avatar }}
                    style={{ width: 22, height: 22, borderRadius: 11 }}
                  />
                </View>
                {/* Active Counterpart Avatar */}
                <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", zIndex: 1, opacity: currentUser === activeUser.id ? 1 : 0.4 }}>
                  <Image
                    source={{ uri: activeUser.avatar }}
                    style={{ width: 22, height: 22, borderRadius: 11 }}
                  />
                </View>
              </TouchableOpacity>
              <Text className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Selected: {currentUser === "me" ? "David" : activeUser.name.split(" ")[0]}
              </Text>
            </View>
          )}
        </View>

        {/* Keyboard Avoiding View wrapping both Messages Stream and Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, paddingBottom: Platform.OS === "android" ? androidKeyboardPadding : 0 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {/* Messages Stream */}
          {messagesLoading ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }} className="bg-white dark:bg-slate-950">
              <ActivityIndicator size="large" color="#a133b2" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={slicedMessages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessageItem}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
              className="flex-1 bg-white dark:bg-slate-950"
              ListHeaderComponent={
                hasMore ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleLoadMore}
                    className="py-3 items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl mb-4 border border-slate-100 dark:border-slate-800"
                  >
                    <Text className="text-xs font-extrabold text-[#a133b2] dark:text-purple-300">
                      See More
                    </Text>
                  </TouchableOpacity>
                ) : null
              }
              ListFooterComponent={
                showTypingIndicator ? (
                  <View className="px-4 mb-4">
                    <View className="flex-row items-center mb-1 ml-11">
                      <Text className="text-[11px] font-bold text-slate-400 italic">
                        {counterpartUser.name} is typing
                      </Text>
                    </View>
                    <TypingIndicator />
                  </View>
                ) : null
              }
            />
          )}
          <View className="flex-col bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center px-4 py-3">
              {/* Image Picker Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handlePickChatImage}
                style={{ marginRight: 12, padding: 4 }}
              >
                <Feather name="image" size={22} color="#a133b2" />
              </TouchableOpacity>

              {/* TextInput Capsule */}
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: isDark ? "#1e293b" : "#f1f5f9", borderRadius: 22, paddingHorizontal: 12, height: 44 }}>
                <TextInput
                  ref={inputRef}
                  value={draftText[activeSenderId] || ""}
                  onChangeText={handleDraftChange}
                  onSubmitEditing={handleSend}
                  onFocus={() => setShowEmojiTray(false)}
                  placeholder={
                    currentMode === "real" && loggedInUser
                      ? `Send as ${loggedInUser.name.split(" ")[0]}...`
                      : `Send as ${currentUser === "me" ? "David" : activeUser.name.split(" ")[0]}...`
                  }
                  placeholderTextColor="#94a3b8"
                  style={{ flex: 1, color: isDark ? "#ffffff" : "#1e293b", fontSize: 15, paddingVertical: 8 }}
                />

                {/* Emoji Toggle Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    if (showEmojiTray) {
                      inputRef.current?.focus();
                    } else {
                      Keyboard.dismiss();
                      setShowEmojiTray(true);
                    }
                  }}
                  style={{ padding: 4, marginRight: 4 }}
                >
                  <Feather name="smile" size={20} color={showEmojiTray ? "#a133b2" : "#94a3b8"} />
                </TouchableOpacity>
              </View>

              {/* Send Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSend}
                disabled={!(draftText[activeSenderId] || "").trim()}
                style={{
                  marginLeft: 12,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: (draftText[activeSenderId] || "").trim() ? "#a133b2" : (isDark ? "#334155" : "#e2e8f0"),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather 
                  name="send" 
                  size={16} 
                  color={(draftText[activeSenderId] || "").trim() ? "#ffffff" : "#94a3b8"} 
                  style={{ marginLeft: 2 }}
                />
              </TouchableOpacity>
            </View>

            {/* Emoji Tray */}
            {showEmojiTray && (
              <View 
                style={{ 
                  height: 220, 
                  backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                  borderTopWidth: 1,
                  borderTopColor: isDark ? "#1e293b" : "#e2e8f0",
                }}
              >
                <FlatList
                  data={POPULAR_EMOJIS}
                  numColumns={7}
                  keyExtractor={(item) => item}
                  contentContainerStyle={{ padding: 12 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      activeOpacity={0.5}
                      onPress={() => {
                        const currentText = draftText[activeSenderId] || "";
                        handleDraftChange(currentText + item);
                      }}
                      style={{ 
                        flex: 1,
                        aspectRatio: 1,
                        alignItems: "center", 
                        justifyContent: "center",
                        margin: 2 
                      }}
                    >
                      <Text style={{ fontSize: 26 }}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
