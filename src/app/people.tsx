import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { ListSkeleton } from "@/components/loading-screen";

import { useLoadingSimulation } from "@/hooks/use-loading-simulation";
import { BackgroundBlobs } from "@/components/background-blobs";
import { ScreenHeader } from "@/components/screen-header";
import { SearchBar } from "@/components/search-bar";

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
    name: "Daniel Mercer",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
    status: "online",
    bio: "Active teammate. Let's chat.",
  },
];

export default function PeopleScreen() {
  const loading = useLoadingSimulation("people");
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);

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

      <BackgroundBlobs />

      <View className="flex-1 px-4 py-4 z-10">
        <ScreenHeader title="Contacts" subtitle="Connect with friends and teammates" />
        <SearchBar placeholder="Search contacts..." value={search} onChangeText={handleSearch} />

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
