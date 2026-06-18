import "@/global.css";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePathname } from "expo-router";
import { ListSkeleton } from "@/components/loading-screen";

// --- Types ---
interface User {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  color: string;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  date: string;
}

// --- Mock Users ---
const USER_A: User = {
  id: "user-a",
  name: "Sarah Connor",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
  initials: "SC",
  color: "bg-indigo-600",
};

const USER_B: User = {
  id: "user-b",
  name: "John Doe",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  initials: "JD",
  color: "bg-slate-800",
};

// --- Helper Component: Typing Animation ---
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
    <View className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 self-start ml-4 mb-4">
      <Animated.View
        style={{ transform: [{ translateY: dot1 }] }}
        className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"
      />
      <Animated.View
        style={{ transform: [{ translateY: dot2 }] }}
        className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"
      />
      <Animated.View
        style={{ transform: [{ translateY: dot3 }] }}
        className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"
      />
    </View>
  );
}

// --- Main Chat Screen Component ---
export default function HomeScreen() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>(USER_A);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      senderId: "user-a",
      text: "Hey John! Did you check out the new design layout?",
      timestamp: "10:15 AM",
      date: "Today",
    },
    {
      id: "2",
      senderId: "user-b",
      text: "Hey Sarah! Yes, I did. The glassmorphism styling is super clean. Very premium!",
      timestamp: "10:18 AM",
      date: "Today",
    },
    {
      id: "3",
      senderId: "user-a",
      text: "Awesome! We should try testing it out with dynamic components next.",
      timestamp: "10:20 AM",
      date: "Today",
    },
  ]);

  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Active counterpart details (who the current user is chatting with)
  const counterpart = currentUser.id === USER_A.id ? USER_B : USER_A;

  // Pulse animation for the online status indicator dot
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Tab Load Simulation
  useEffect(() => {
    if (pathname === "/") {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Scroll to bottom on new messages or typing indicator toggle
  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Send message
  const handleSend = () => {
    if (!inputText.trim()) return;

    const timeString = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMsg: Message = {
      id: Math.random().toString(),
      senderId: currentUser.id,
      text: inputText.trim(),
      timestamp: timeString,
      date: "Today",
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Simulate counterpart response
    simulateCounterpartReply(newMsg.senderId);
  };

  // Switch between User A and User B
  const toggleUser = () => {
    const nextUser = currentUser.id === USER_A.id ? USER_B : USER_A;
    setCurrentUser(nextUser);
  };

  // Automatic reply simulation
  const simulateCounterpartReply = (sentByUserId: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);

      const replies = [
        "Sounds good! Let's make it happen.",
        "I'm working on the styling file right now, should be ready soon.",
        "Could you check if that looks correct on Android too?",
        "Awesome! Let know if you run into any issues.",
        "I'll review this and get back to you shortly.",
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const timeString = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          senderId: sentByUserId === USER_A.id ? USER_B.id : USER_A.id,
          text: randomReply,
          timestamp: timeString,
          date: "Today",
        },
      ]);
    }, 2000);
  };

  // Render message bubble item
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isSent = item.senderId === currentUser.id;

    return (
      <View
        className={`flex-row mb-4 ${isSent ? "justify-end" : "justify-start"}`}
      >
        <View
          className={`max-w-[78%] px-4 py-2.5 shadow-sm ${
            isSent
              ? `${currentUser.color} rounded-2xl rounded-tr-none`
              : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-none"
          }`}
        >
          <Text
            className={`text-[15px] leading-5 ${
              isSent ? "text-white" : "text-slate-800 dark:text-slate-100"
            }`}
          >
            {item.text}
          </Text>
          <Text
            className={`text-[9px] mt-1 text-right ${
              isSent ? "text-white opacity-70" : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return <ListSkeleton />;
  }

  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-900 md:justify-center md:items-center">
      <StatusBar barStyle={Platform.OS === "ios" ? "dark-content" : "default"} />

      <SafeAreaView className="flex-1 w-full md:max-w-md bg-slate-50 dark:bg-slate-950 md:shadow-2xl md:rounded-3xl md:my-6 md:border md:border-slate-100 dark:md:border-slate-900 overflow-hidden">
        {/* --- Header --- */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <View className="flex-row items-center gap-3">
            {/* Counterpart Avatar */}
            <View className="relative">
              <Image
                source={{ uri: counterpart.avatar }}
                className="w-10 h-10 rounded-full bg-slate-200"
              />
              <Animated.View
                style={{ opacity: pulseAnim }}
                className="absolute right-0 bottom-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"
              />
            </View>

            {/* Counterpart Name & Online Status */}
            <View>
              <Text className="text-base font-semibold text-slate-800 dark:text-slate-100">
                {counterpart.name}
              </Text>
              <Text className="text-xs text-emerald-500 font-medium">Online</Text>
            </View>
          </View>

          {/* User Switching Badge */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleUser}
            className="flex-row items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700"
          >
            <View className={`w-2.5 h-2.5 rounded-full ${currentUser.color}`} />
            <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              As: {currentUser.name.split(" ")[0]}
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- Message Stream --- */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
          className="flex-1"
          ListHeaderComponent={
            <View className="items-center justify-center my-4">
              <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                Today
              </Text>
            </View>
          }
          ListFooterComponent={
            isTyping ? (
              <View className="flex-row items-center gap-2 mb-2">
                <Text className="text-[11px] text-slate-400 italic ml-4 mb-1">
                  {counterpart.name} is typing
                </Text>
                <TypingIndicator />
              </View>
            ) : null
          }
        />

        {/* --- Footer & Input --- */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View className="flex-row items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            {/* Input Box */}
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={`Message as ${currentUser.name.split(" ")[0]}...`}
              placeholderTextColor="#94a3b8"
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-full text-slate-800 dark:text-slate-100 text-[15px]"
            />

            {/* Send Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSend}
              className={`w-10 h-10 rounded-full items-center justify-center shadow-sm ${
                inputText.trim() ? currentUser.color : "bg-slate-200 dark:bg-slate-800"
              }`}
              disabled={!inputText.trim()}
            >
              <Text
                className={`text-lg font-bold ${
                  inputText.trim() ? "text-white" : "text-slate-400 dark:text-slate-600"
                }`}
              >
                ↑
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}