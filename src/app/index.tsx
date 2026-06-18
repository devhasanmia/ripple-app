import { ListSkeleton } from "@/components/loading-screen";
import "@/global.css";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";

// --- Types ---
interface User {
  id: string;
  name: string;
  avatar: string;
  ringColor: string;
  lastSeen: string;
  unreadCount: number;
  lastMessage: string;
  date: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  type: "text" | "voice";
  text?: string;
  waveformType?: 1 | 2 | 3;
  timestamp: string;
  showAvatar?: boolean;
}

// --- Mock Users ---
const MOCK_USERS: User[] = [
  {
    id: "daniel-mercer",
    name: "Daniel Mercer",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
    ringColor: "#a133b2",
    lastSeen: "Active Now",
    unreadCount: 2,
    lastMessage: "Hi, David. Hope you're doing....",
    date: "05 Jan",
  },
  {
    id: "jessie-winfield",
    name: "Jessie Winfield",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    ringColor: "#e91e63",
    lastSeen: "Active 5m ago",
    unreadCount: 0,
    lastMessage: "Are you ready for today's part..",
    date: "04 Jan",
  },
  {
    id: "joseph-harvell",
    name: "Joseph Harvell",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    ringColor: "#03a9f4",
    lastSeen: "Active 1h ago",
    unreadCount: 0,
    lastMessage: "I'm sending you a parcel rece..",
    date: "03 Jan",
  },
  {
    id: "helen-eberle",
    name: "Helen Eberle",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    ringColor: "#4caf50",
    lastSeen: "Active 2h ago",
    unreadCount: 0,
    lastMessage: "Hope you're doing well today..",
    date: "31 Dec",
  },
  {
    id: "charles-davis",
    name: "Charles Davis",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
    ringColor: "#ff9800",
    lastSeen: "Active Yesterday",
    unreadCount: 0,
    lastMessage: "Let's get back to the work, You..",
    date: "25 Dec",
  },
  {
    id: "sean-higdon",
    name: "Sean Higdon",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    ringColor: "#ff5722",
    lastSeen: "Active 3d ago",
    unreadCount: 0,
    lastMessage: "Listen david, i have a problem..",
    date: "12 Nov",
  },
];

// --- Initial Conversations ---
const DANIEL_CONVERSATION: ChatMessage[] = [
  { id: "1", senderId: "daniel-mercer", type: "text", text: "Are you still travelling?", timestamp: "10:10 AM", showAvatar: true },
  { id: "2", senderId: "me", type: "text", text: "Yes, i'm at Istanbul..", timestamp: "10:12 AM" },
  { id: "3", senderId: "daniel-mercer", type: "text", text: "OoOo, Thats so Cool!", timestamp: "10:14 AM", showAvatar: false },
  { id: "4", senderId: "daniel-mercer", type: "text", text: "Raining??", timestamp: "10:14 AM", showAvatar: true },
  { id: "5", senderId: "me", type: "voice", waveformType: 1, timestamp: "10:15 AM" },
  { id: "6", senderId: "daniel-mercer", type: "text", text: "Hi, Did you heared?", timestamp: "10:18 AM", showAvatar: false },
  { id: "7", senderId: "daniel-mercer", type: "voice", waveformType: 2, timestamp: "10:20 AM", showAvatar: false },
  { id: "8", senderId: "daniel-mercer", type: "text", text: "Ok!", timestamp: "10:21 AM", showAvatar: true },
  { id: "9", senderId: "me", type: "voice", waveformType: 3, timestamp: "10:22 AM" },
];

const waveHeights1 = [8, 12, 16, 10, 8, 14, 20, 16, 12, 18, 22, 14, 8, 12, 16, 10, 8, 14, 18, 12];
const waveHeights2 = [10, 14, 18, 24, 28, 20, 16, 12, 8, 10, 16, 22, 18, 12, 14, 20, 24, 16, 10, 8, 12, 16, 22, 26, 18, 14, 12, 10, 16, 14, 8, 6];
const waveHeights3 = [12, 16, 20, 24, 18, 14, 10, 12, 16, 22, 26, 20, 14, 12, 16, 20, 24, 18, 14, 10, 12, 16, 20, 24, 18, 14, 10, 8];

function Waveform({ type, color }: { type: 1 | 2 | 3; color: string }) {
  const heights = type === 1 ? waveHeights1 : type === 2 ? waveHeights2 : waveHeights3;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", height: 32, paddingHorizontal: 4 }}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={{
            height: h,
            width: 2,
            backgroundColor: color,
            marginHorizontal: 1,
            borderRadius: 9999,
          }}
        />
      ))}
    </View>
  );
}

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -5,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(350),
        ])
      );
    };

    const animation = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]);

    animation.start();
    return () => animation.stop();
  }, [dot1, dot2, dot3]);

  return (
    <View className="flex-row items-center gap-1 px-3 py-2 rounded-2xl bg-[#f0f0f3] dark:bg-slate-800 self-start ml-11 mb-4">
      <Animated.View
        style={{ transform: [{ translateY: dot1 }], width: 6, height: 6, borderRadius: 3, backgroundColor: "#94a3b8" }}
      />
      <Animated.View
        style={{ transform: [{ translateY: dot2 }], width: 6, height: 6, borderRadius: 3, backgroundColor: "#94a3b8" }}
      />
      <Animated.View
        style={{ transform: [{ translateY: dot3 }], width: 6, height: 6, borderRadius: 3, backgroundColor: "#94a3b8" }}
      />
    </View>
  );
}

let hasLoadedHome = false;

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(!hasLoadedHome);
  const [searchQuery, setSearchQuery] = useState("");

  // Navigation State
  const [activeUser, setActiveUser] = useState<User | null>(null);

  // Custom message histories for different chats
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({
    "daniel-mercer": DANIEL_CONVERSATION,
  });

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Tab Load Simulation
  useEffect(() => {
    if (!hasLoadedHome) {
      const timer = setTimeout(() => {
        setLoading(false);
        hasLoadedHome = true;
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const activeMessages = activeUser ? (conversations[activeUser.id] || []) : [];

  useEffect(() => {
    if (activeUser) {
      scrollToBottom();
    }
  }, [activeMessages, isTyping, activeUser]);

  const handleSend = () => {
    if (!activeUser || !inputText.trim()) return;

    const timeString = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      senderId: "me",
      type: "text",
      text: inputText.trim(),
      timestamp: timeString,
    };

    setConversations((prev) => ({
      ...prev,
      [activeUser.id]: [...(prev[activeUser.id] || []), newMsg],
    }));

    setInputText("");
    simulatePartnerReply(activeUser.id);
  };

  const simulatePartnerReply = (userId: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);

      const replies = [
        "Sounds good! Let's make it happen.",
        "That's awesome!",
        "Alright, let me review it.",
        "Sure, no problem at all!",
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const timeString = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      setConversations((prev) => ({
        ...prev,
        [userId]: [
          ...(prev[userId] || []),
          {
            id: Math.random().toString(),
            senderId: userId,
            type: "text",
            text: randomReply,
            timestamp: timeString,
            showAvatar: true,
          },
        ],
      }));
    }, 2000);
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isSent = item.senderId === "me";

    if (item.type === "voice") {
      if (isSent) {
        return (
          <View className="flex-row justify-end mb-4">
            <View
              style={{ borderTopRightRadius: 0, paddingHorizontal: 16, paddingVertical: 10 }}
              className="flex-row items-center bg-[#f4e5f6] rounded-2xl"
            >
              <Waveform type={item.waveformType || 1} color="#a133b2" />
              <TouchableOpacity
                activeOpacity={0.7}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 10,
                }}
              >
                <Ionicons name="play" size={12} color="#a133b2" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>
          </View>
        );
      } else {
        return (
          <View className="flex-row justify-start mb-4 items-end">
            <View style={{ width: 32, height: 32, marginRight: 8 }} />
            <View
              style={{ borderTopLeftRadius: 0, paddingHorizontal: 16, paddingVertical: 10 }}
              className="flex-row items-center bg-[#f0f0f3] dark:bg-slate-800 rounded-2xl"
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1e293b", marginTop: 4 }}>"</Text>
              </View>
              <Waveform type={item.waveformType || 2} color="#1e293b" />
            </View>
          </View>
        );
      }
    }

    return (
      <View className={`flex-row mb-4 items-end ${isSent ? "justify-end" : "justify-start"}`}>
        {!isSent && (
          <View style={{ width: 32, height: 32, marginRight: 8, position: "relative" }}>
            {item.showAvatar && activeUser ? (
              <>
                <Image
                  source={{ uri: activeUser.avatar }}
                  style={{ width: 32, height: 32, borderRadius: 16 }}
                />
                <View
                  style={{
                    position: "absolute",
                    top: -1,
                    right: -1,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#a133b2",
                    borderWidth: 1.5,
                    borderColor: "#ffffff",
                  }}
                />
              </>
            ) : null}
          </View>
        )}

        <View
          style={isSent ? { borderTopRightRadius: 0, paddingHorizontal: 18, paddingVertical: 10 } : { borderTopLeftRadius: 0, paddingHorizontal: 18, paddingVertical: 10 }}
          className={`max-w-[75%] rounded-2xl ${isSent ? "bg-[#f4e5f6]" : "bg-[#f0f0f3] dark:bg-slate-800"
            }`}
        >
          <Text
            className={`text-[15px] leading-5 ${isSent ? "text-[#a133b2] font-semibold" : "text-slate-800 dark:text-slate-100"
              }`}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  const filteredUsers = MOCK_USERS.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <ListSkeleton />;
  }

  const topPaddingOffset = Platform.OS === "web" ? 64 : 0;

  // --- SUB-SCREEN: CHAT ROOM SCREEN (If activeUser is selected) ---
  if (activeUser) {
    return (
      <View style={{ flex: 1, backgroundColor: "#ffffff", paddingTop: topPaddingOffset }}>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          backgroundColor={colorScheme === "dark" ? "#020617" : "#ffffff"}
          translucent={false}
        />
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["bottom", "left", "right"]}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: "#ffffff",
              borderBottomWidth: 1,
              borderBottomColor: "#f1f5f9",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              {/* Back Button */}
              <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveUser(null)} className="p-1 mr-3">
                <Ionicons name="arrow-back" size={24} color="#1e293b" className="dark:text-slate-100" />
              </TouchableOpacity>

              {/* Avatar with status dot */}
              <View style={{ position: "relative", marginRight: 16 }}>
                <Image
                  source={{ uri: activeUser.avatar }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
                <View
                  style={{
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                    width: 12,
                    height: 12,
                    backgroundColor: "#10b981",
                    borderWidth: 2,
                    borderColor: "#ffffff",
                    borderRadius: 6,
                  }}
                />
              </View>

              {/* Title & Status */}
              <View>
                <Text className="text-base font-bold text-slate-800 dark:text-slate-100 font-sans">
                  {activeUser.name}
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <Text className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    Active Now
                  </Text>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "#a133b2",
                      marginLeft: 6,
                    }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Messages Stream */}
          <FlatList
            ref={flatListRef}
            data={activeMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
            className="flex-1"
            ListHeaderComponent={
              <View className="items-center justify-center my-4">
                <Text className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  THURSDAY 24, 2022
                </Text>
              </View>
            }
            ListFooterComponent={
              isTyping ? (
                <View className="flex-row items-center mb-2">
                  <TypingIndicator />
                </View>
              ) : null
            }
          />

          {/* Input Bar */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 95 : 0}
          >
            <View className="flex-row items-center px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#f5f5f7",
                  borderRadius: 22,
                  paddingHorizontal: 16,
                  height: 44,
                }}
              >
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={handleSend}
                  placeholder="Send Message"
                  placeholderTextColor="#94a3b8"
                  style={{
                    flex: 1,
                    color: "#1e293b",
                    fontSize: 15,
                    paddingVertical: 8,
                  }}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleSend}
                  disabled={!inputText.trim()}
                  style={{ padding: 4 }}
                >
                  <Feather name="send" size={18} color={inputText.trim() ? "#a133b2" : "#94a3b8"} />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // --- SUB-SCREEN: CHAT LIST SCREEN (Default home list screen) ---
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff", paddingTop: topPaddingOffset }}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colorScheme === "dark" ? "#020617" : "#ffffff"}
        translucent={false}
      />
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["bottom", "left", "right"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3 bg-white dark:bg-slate-900">
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 27, fontWeight: "900", color: "#a133b2", letterSpacing: -0.5 }}>
              Ripple
            </Text>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#a133b2", marginLeft: 3, marginTop: 16 }} />
          </View>
        </View>

        {/* Search Input */}
        <View className="px-5 mb-4">
          <View className="flex-row items-center bg-[#f5f5f7] dark:bg-slate-800 px-4 py-1.5 rounded-full">
            <Ionicons name="search" size={18} color="#a133b2" />
            <TextInput
              placeholder="Search here.."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-[14.5px] text-slate-800 dark:text-slate-100 py-1"
            />
            <Ionicons name="mic-outline" size={18} color="#94a3b8" />
          </View>
        </View>

        {/* Chats Feed List */}
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveUser(item)}
              className="flex-row items-center py-3.5 border-b border-slate-50 dark:border-slate-850"
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  borderWidth: 2,
                  borderColor: item.ringColor,
                  padding: 2,
                  marginRight: 14,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  source={{ uri: item.avatar }}
                  style={{ width: "100%", height: "100%", borderRadius: 20 }}
                />
              </View>

              <View className="flex-1 pr-2">
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text className="text-[15px] font-bold text-slate-850 dark:text-slate-100">
                    {item.name}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View
                      style={{
                        backgroundColor: "#a133b2",
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 4,
                        marginLeft: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: "#ffffff",
                          fontSize: 10,
                          fontWeight: "bold",
                          lineHeight: 10,
                        }}
                      >
                        {item.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  className="text-[12.5px] mt-1 text-slate-400 dark:text-slate-500 font-medium"
                >
                  {item.lastMessage}
                </Text>
              </View>

              <Text className="text-[11px] text-slate-400 dark:text-slate-650 font-medium">
                {item.date}
              </Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </View>
  );
}