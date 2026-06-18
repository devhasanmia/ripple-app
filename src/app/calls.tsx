import React, { useState, useEffect } from "react";
import { usePathname } from "expo-router";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
} from "react-native";
import { ListSkeleton } from "@/components/loading-screen";

interface CallLog {
  id: string;
  name: string;
  avatar: string;
  type: "voice" | "video";
  direction: "incoming" | "outgoing" | "missed";
  timestamp: string;
}

const MOCK_CALLS: CallLog[] = [
  {
    id: "1",
    name: "Tony Stark",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    type: "video",
    direction: "outgoing",
    timestamp: "10 mins ago",
  },
  {
    id: "2",
    name: "Sarah Connor",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    type: "voice",
    direction: "incoming",
    timestamp: "1 hour ago",
  },
  {
    id: "3",
    name: "Bruce Wayne",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    type: "voice",
    direction: "missed",
    timestamp: "Yesterday",
  },
  {
    id: "4",
    name: "Ellen Ripley",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
    type: "video",
    direction: "incoming",
    timestamp: "2 days ago",
  },
];

export default function CallsScreen() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [calls, setCalls] = useState<CallLog[]>(MOCK_CALLS);

  // Simulate network load when screen is focused
  useEffect(() => {
    if (pathname === "/calls") {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = MOCK_CALLS.filter((call) =>
      call.name.toLowerCase().includes(text.toLowerCase())
    );
    setCalls(filtered);
  };

  const startCall = (name: string, type: "voice" | "video") => {
    Alert.alert("Calling...", `Initiating ${type} call to ${name}...`);
  };

  const getDirectionDetails = (direction: CallLog["direction"]) => {
    switch (direction) {
      case "incoming":
        return { label: "Incoming", color: "text-emerald-500", icon: "↙" };
      case "outgoing":
        return { label: "Outgoing", color: "text-indigo-600", icon: "↗" };
      case "missed":
        return { label: "Missed", color: "text-rose-500", icon: "↙" };
    }
  };

  if (loading) {
    return <ListSkeleton />;
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />

      {/* Background Glowing Blobs for Premium Feel */}
      <View className="absolute top-0 left-0 right-0 bottom-0 bg-slate-50/50 z-0 overflow-hidden">
        <View className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/5 opacity-60 filter blur-3xl" />
        <View className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-500/5 opacity-40 filter blur-3xl" />
      </View>

      <View className="flex-1 px-4 py-4 z-10">
        {/* Header */}
        <View className="mb-5">
          <Text className="text-[25px] font-black text-slate-900 tracking-tight">
            Recent Calls
          </Text>
          <Text className="text-xs text-slate-400 mt-0.5">
            Voice and video call history
          </Text>
        </View>

        {/* Search Bar */}
        <View className="bg-slate-100 border border-slate-200/60 rounded-full px-4.5 py-3 mb-5 flex-row items-center shadow-sm">
          <Text className="text-slate-400 mr-2.5 text-sm">🔍</Text>
          <TextInput
            placeholder="Search call logs..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={handleSearch}
            className="flex-1 text-[14px] text-slate-800"
          />
        </View>

        {/* Call Logs List */}
        <FlatList
          data={calls}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-slate-400 text-sm italic">
                No calls found matching "{search}"
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const dir = getDirectionDetails(item.direction);
            return (
              <View
                className="flex-row items-center p-4 bg-white rounded-3xl border border-slate-100 shadow-md shadow-slate-200/20 mb-3"
              >
                {/* Avatar */}
                <Image
                  source={{ uri: item.avatar }}
                  className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 mr-4"
                />

                {/* Call Info */}
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-slate-900">
                    {item.name}
                  </Text>
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <Text className={`text-xs ${dir.color} font-bold`}>
                      {dir.icon}
                    </Text>
                    <Text className="text-xs text-slate-400">
                      {dir.label} • {item.timestamp}
                    </Text>
                  </View>
                </View>

                {/* Calling Buttons */}
                <View className="flex-row items-center gap-2.5">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => startCall(item.name, "voice")}
                    className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-200/50"
                  >
                    <Text className="text-base">📞</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => startCall(item.name, "video")}
                    className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-200/50"
                  >
                    <Text className="text-base">📹</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}
