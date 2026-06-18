import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { ListSkeleton } from "@/components/loading-screen";

interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline";
  bio: string;
}

const MOCK_CONTACTS: Contact[] = [
  {
    id: "1",
    name: "Sarah Connor",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    status: "online",
    bio: "Looking for John. Tech enthusiast.",
  },
  {
    id: "2",
    name: "John Doe",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    status: "offline",
    bio: "Busy coding. Do not disturb.",
  },
  {
    id: "3",
    name: "Ellen Ripley",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
    status: "online",
    bio: "Warrant Officer on Nostromo.",
  },
  {
    id: "4",
    name: "Luke Skywalker",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    status: "online",
    bio: "May the Force be with you.",
  },
  {
    id: "5",
    name: "Bruce Wayne",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    status: "offline",
    bio: "I am Gotham.",
  },
  {
    id: "6",
    name: "Tony Stark",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    status: "online",
    bio: "I love you 3000.",
  },
];

let hasLoadedPeople = false;

export default function PeopleScreen() {
  const [loading, setLoading] = useState(!hasLoadedPeople);
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);

  // Simulate network load when screen is focused
  useEffect(() => {
    if (!hasLoadedPeople) {
      const timer = setTimeout(() => {
        setLoading(false);
        hasLoadedPeople = true;
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = MOCK_CONTACTS.filter((contact) =>
      contact.name.toLowerCase().includes(text.toLowerCase())
    );
    setContacts(filtered);
  };

  const handleContactPress = (name: string) => {
    Alert.alert("Chat", `Starting chat session with ${name}...`);
  };

  if (loading) {
    return <ListSkeleton />;
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" translucent={false} />

      {/* Background Glowing Blobs for Premium Feel */}
      <View className="absolute top-0 left-0 right-0 bottom-0 bg-slate-50/50 z-0 overflow-hidden">
        <View className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/5 opacity-60 filter blur-3xl" />
        <View className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-500/5 opacity-40 filter blur-3xl" />
      </View>

      <View className="flex-1 px-4 py-4 z-10">
        {/* Header */}
        <View className="mb-5">
          <Text className="text-[25px] font-black text-slate-905 tracking-tight">
            Contacts
          </Text>
          <Text className="text-xs text-slate-400 mt-0.5">
            Connect with friends and teammates
          </Text>
        </View>

        {/* Search Bar */}
        <View className="bg-slate-100 border border-slate-200/60 rounded-full px-4.5 py-3 mb-5 flex-row items-center shadow-sm">
          <Text className="text-slate-400 mr-2.5 text-sm">🔍</Text>
          <TextInput
            placeholder="Search contacts..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={handleSearch}
            className="flex-1 text-[14px] text-slate-800"
          />
        </View>

        {/* Contacts List */}
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-slate-400 text-sm italic">
                No contacts found matching "{search}"
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => handleContactPress(item.name)}
              className="flex-row items-center p-4 bg-white rounded-3xl border border-slate-100 shadow-md shadow-slate-200/20 mb-3"
            >
              {/* Avatar with Status Indicator */}
              <View className="relative mr-4">
                <Image
                  source={{ uri: item.avatar }}
                  className={`w-12 h-12 rounded-full bg-slate-100 border ${
                    item.status === "online" ? "border-emerald-500/60 p-0.5" : "border-slate-200"
                  }`}
                />
                {item.status === "online" && (
                  <View className="absolute right-0 bottom-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                )}
              </View>

              {/* Bio & Details */}
              <View className="flex-1 pr-2">
                <Text className="text-[15px] font-bold text-slate-900">
                  {item.name}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-xs text-slate-400 mt-0.5"
                >
                  {item.bio}
                </Text>
              </View>

              {/* Action Button */}
              <View className="bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-100/50">
                <Text className="text-xs font-bold text-indigo-600">
                  Chat
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
