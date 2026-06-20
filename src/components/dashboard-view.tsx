import { ChatMessage, ChatRequest, User } from "@/types";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  FlatList,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BackgroundBlobs } from "./background-blobs";
import { ExploreTab } from "./explore-tab";
import { ListSkeleton } from "./loading-screen";
import { ProfileTab } from "./profile-tab";
import { RequestsTab } from "./requests-tab";

interface DashboardViewProps {
  currentMode: "demo" | "real" | null;
  setCurrentMode: (m: "demo" | "real" | null) => void;
  realActiveTab: "chats" | "explore" | "requests" | "profile";
  setRealActiveTab: (t: "chats" | "explore" | "requests" | "profile") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeUser: User | null;
  setActiveUser: (u: User | null) => void;
  loggedInUser: User | null;
  davidUser: User;
  mockUsers: User[];
  realChats: User[];
  exploreUsers: User[];
  onlineStatus: Record<string, boolean>;
  pendingRequests: ChatRequest[];
  sentRequests: any[];
  requestsSubTab: "incoming" | "sent";
  setRequestsSubTab: (s: "incoming" | "sent") => void;
  handleSendRequest: (userId: string) => void;
  handleRequestResponse: (requestId: string, status: "accepted" | "declined") => void;
  handleCancelRequest: (requestId: string) => void;
  handleResendRequest: (requestId: string) => void;
  handleLogout: () => void;
  colorScheme: "light" | "dark" | null;
  topPaddingOffset: number;
  handleLayout: (e: any) => void;
  androidKeyboardPadding: number;

  // Profile form props
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
  realChatsLoading?: boolean;
  exploreLoading?: boolean;
  requestsLoading?: boolean;
  conversations: Record<string, ChatMessage[]>;
  unreadCounts: Record<string, number>;
  lastActivityAt: Record<string, number>;
}

export function DashboardView({
  currentMode,
  setCurrentMode,
  realActiveTab,
  setRealActiveTab,
  searchQuery,
  setSearchQuery,
  activeUser,
  setActiveUser,
  loggedInUser,
  davidUser,
  mockUsers,
  realChats,
  exploreUsers,
  onlineStatus,
  pendingRequests,
  sentRequests,
  requestsSubTab,
  setRequestsSubTab,
  handleSendRequest,
  handleRequestResponse,
  handleCancelRequest,
  handleResendRequest,
  handleLogout,
  colorScheme,
  topPaddingOffset,
  handleLayout,
  androidKeyboardPadding,

  // Profile props
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
  realChatsLoading = false,
  exploreLoading = false,
  requestsLoading = false,
  conversations,
  lastActivityAt,
  unreadCounts,
}: DashboardViewProps) {
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";

  // Helper to compute unread count and shortened last message in real-time
  const getChatInfo = (user: User) => {
    const thread = conversations[user.id] || [];
    const count = unreadCounts[user.id] !== undefined ? unreadCounts[user.id] : (user.unreadCount || 0);

    let lastMsgText = user.lastMessage || "No messages yet";
    let lastMsgTime = user.date || "";

    if (thread.length > 0) {
      const lastMsg = thread[thread.length - 1];
      if (lastMsg.type === "image") {
        lastMsgText = "📷 Image";
      } else if (lastMsg.type === "voice") {
        lastMsgText = "🎤 Voice message";
      } else if (lastMsg.text) {
        const words = lastMsg.text.trim().split(/\s+/);
        if (words.length > 3) {
          lastMsgText = words.slice(0, 3).join(" ") + "...";
        } else {
          lastMsgText = lastMsg.text;
        }
      }
      lastMsgTime = lastMsg.timestamp || "";
    } else if (lastMsgText && lastMsgText !== "No messages yet") {
      const words = lastMsgText.trim().split(/\s+/);
      if (words.length > 3) {
        lastMsgText = words.slice(0, 3).join(" ") + "...";
      }
    }

    return {
      lastMessage: lastMsgText,
      unreadCount: count,
      date: lastMsgTime,
    };
  };

  // Sort key: epoch ms of last message in this thread. Higher = more recently active.
  // Falls back to 0 for threads with no messages (appear below active ones).
  const getLastActivityKey = (userId: string): number => lastActivityAt[userId] ?? 0;

  // Filter + sort lists: most recently active conversation appears first
  const filteredRealChats = realChats
    .filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => getLastActivityKey(b.id) - getLastActivityKey(a.id));

  const filteredExploreUsers = exploreUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDemoUsers = mockUsers
    .filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => getLastActivityKey(b.id) - getLastActivityKey(a.id));

  // ==================== REAL MODE DASHBOARD ====================
  if (currentMode === "real") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? "#020617" : "#ffffff",
          paddingTop: topPaddingOffset,
        }}
        onLayout={handleLayout}
      >
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={isDark ? "#020617" : "#ffffff"}
          translucent={false}
        />
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top", "bottom", "left", "right"]}>
          <BackgroundBlobs />

          {/* Real Mode Header */}
          <View className="flex-row items-center justify-between px-5 pt-8 pb-3 bg-transparent">
            <View className="flex-row items-center gap-3">
              <Image
                source={{
                  uri:
                    loggedInUser?.avatar ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
                }}
                style={{ width: 38, height: 38, borderRadius: 19 }}
              />
              <View>
                <Text className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {loggedInUser?.name}
                </Text>
                <Text className="text-[10px] text-slate-400 font-semibold">
                  @{loggedInUser?.username}
                </Text>
              </View>
            </View>
          </View>

          {/* Search Input Container */}
          {realActiveTab !== "requests" && realActiveTab !== "profile" && (
            <View className="px-5 mb-5">
              <View className="flex-row items-center bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl">
                <Feather name="search" size={18} color="#a133b2" />
                <TextInput
                  placeholder="Search conversations..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 ml-3 text-[14.5px] text-slate-800 dark:text-slate-100 font-semibold py-0.5"
                />
                {searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                ) : (
                  <Feather name="mic" size={18} color="#94a3b8" />
                )}
              </View>
            </View>
          )}

          {/* Main Content Area */}
          <View className="flex-1 px-5 mt-2">
            {realActiveTab === "chats" && (
              realChatsLoading ? (
                <ListSkeleton />
              ) : filteredRealChats.length === 0 ? (
                <View className="flex-1 justify-center items-center px-4">
                  <Ionicons name="chatbubbles-outline" size={48} color="#94a3b8" />
                  <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-4 text-center leading-5">
                    No active chats yet.{"\n"}Go to the Explore tab to find users and start chatting!
                  </Text>
                </View>
              ) : (
                <View className="flex-1">
                  {/* Active Teammates Tray */}
                  <View className="mb-6">
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Active Teammates
                      </Text>
                      <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    </View>
                    <FlatList
                      horizontal
                      data={[
                        // Inject the logged-in user at the beginning as "My Status"
                        {
                          id: "me-status",
                          name: "My Note",
                          avatar: loggedInUser?.avatar || davidUser.avatar,
                          isMe: true,
                        },
                        ...realChats.filter((u) => onlineStatus[u.id]),
                      ]}
                      keyExtractor={(item) => `active-${item.id}`}
                      showsHorizontalScrollIndicator={false}
                      renderItem={({ item }) => {
                        if (item.id === "me-status") {
                          return (
                            <TouchableOpacity activeOpacity={0.85} className="items-center mr-5">
                              <View className="relative">
                                <Image source={{ uri: item.avatar }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                                <View className="absolute bottom-0 right-0 bg-[#a133b2] w-5 h-5 rounded-full justify-center items-center border-2 border-slate-50 dark:border-slate-950">
                                  <Feather name="plus" size={12} color="#ffffff" />
                                </View>
                              </View>
                              <Text className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-2 text-center">
                                My Note
                              </Text>
                            </TouchableOpacity>
                          );
                        }

                        return (
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => setActiveUser(item as User)}
                            className="items-center mr-5"
                          >
                            <View className="relative">
                              <Image source={{ uri: item.avatar }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                              <View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-slate-50 dark:border-slate-950" />
                            </View>
                            <Text
                              className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 mt-2 text-center max-w-[60px]"
                              numberOfLines={1}
                            >
                              {item.name.split(" ")[0]}
                            </Text>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>

                  <FlatList
                    data={filteredRealChats}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    renderItem={({ item }) => {
                      const { lastMessage, unreadCount, date } = getChatInfo(item);
                      return (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setActiveUser(item)}
                          className="flex-row items-center p-3.5 bg-white dark:bg-slate-900 rounded-2xl mb-3"
                        >
                          <View className="relative mr-3.5">
                            <Image source={{ uri: item.avatar }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                            {onlineStatus[item.id] && (
                              <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-1.5 border-white dark:border-slate-900" />
                            )}
                          </View>
                          <View className="flex-1 pr-2">
                            <View className="flex-row items-center justify-between">
                              <Text className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
                                {item.name}
                              </Text>
                              <Text className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                {date}
                              </Text>
                            </View>
                            <View className="flex-row items-center justify-between mt-1">
                              <Text
                                numberOfLines={1}
                                className="flex-1 text-[12.5px] text-slate-500 dark:text-slate-400 font-medium mr-2"
                              >
                                {lastMessage}
                              </Text>
                              {unreadCount > 0 && (
                                <View
                                  style={{
                                    backgroundColor: "#a133b2",
                                    minWidth: 18,
                                    height: 18,
                                    borderRadius: 9,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    paddingHorizontal: 4,
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
                                    {unreadCount}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              )
            )}

            {realActiveTab === "explore" && (
              exploreLoading ? (
                <ListSkeleton />
              ) : (
                <ExploreTab
                  filteredUsers={filteredExploreUsers}
                  onlineStatus={onlineStatus}
                  handleSendRequest={handleSendRequest}
                />
              )
            )}

            {realActiveTab === "requests" && (
              requestsLoading ? (
                <ListSkeleton />
              ) : (
                <RequestsTab
                  pendingRequests={pendingRequests}
                  sentRequests={sentRequests}
                  requestsSubTab={requestsSubTab}
                  setRequestsSubTab={setRequestsSubTab}
                  handleRequestResponse={handleRequestResponse}
                  handleCancelRequest={handleCancelRequest}
                  handleResendRequest={handleResendRequest}
                />
              )
            )}

            {realActiveTab === "profile" && (
              <ProfileTab
                editName={editName}
                setEditName={setEditName}
                editUsername={editUsername}
                setEditUsername={setEditUsername}
                editPin={editPin}
                setEditPin={setEditPin}
                showPin={showPin}
                setShowPin={setShowPin}
                editAvatarUri={editAvatarUri}
                handlePickAvatar={handlePickAvatar}
                profileMessage={profileMessage}
                profileUpdating={profileUpdating}
                handleSaveProfile={handleSaveProfile}
                setRealActiveTab={setRealActiveTab}
                handleLogout={handleLogout}
                androidKeyboardPadding={androidKeyboardPadding}
                isDark={isDark}
              />
            )}
          </View>
        </SafeAreaView>

        {/* Custom Bottom Tab Bar */}
        <View
          className="absolute left-4 right-4 flex-row bg-white/95 dark:bg-slate-900/95 py-3 px-2 justify-around rounded-full"
          style={{ bottom: Math.max(insets.bottom, 16) }}
        >
          <TouchableOpacity onPress={() => setRealActiveTab("chats")} className="items-center py-1 flex-1">
            <Ionicons
              name={realActiveTab === "chats" ? "chatbubbles" : "chatbubbles-outline"}
              size={20}
              color={realActiveTab === "chats" ? "#a133b2" : "#94a3b8"}
            />
            <Text className={`text-[10px] font-bold mt-1 ${realActiveTab === "chats" ? "text-[#a133b2]" : "text-slate-400"}`}>
              Chats
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setRealActiveTab("explore")} className="items-center py-1 flex-1">
            <Ionicons
              name={realActiveTab === "explore" ? "compass" : "compass-outline"}
              size={20}
              color={realActiveTab === "explore" ? "#a133b2" : "#94a3b8"}
            />
            <Text className={`text-[10px] font-bold mt-1 ${realActiveTab === "explore" ? "text-[#a133b2]" : "text-slate-400"}`}>
              Explore
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRealActiveTab("requests")}
            className="items-center py-1 flex-1"
            style={{ position: "relative" }}
          >
            <Ionicons
              name={realActiveTab === "requests" ? "people" : "people-outline"}
              size={22}
              color={realActiveTab === "requests" ? "#a133b2" : "#94a3b8"}
            />
            {pendingRequests.filter((r) => r.status === "pending").length > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  right: "20%",
                  backgroundColor: "#ef4444",
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 4,
                  borderWidth: 1.5,
                  borderColor: "#ffffff",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 10, fontWeight: "900", lineHeight: 12 }}>
                  {pendingRequests.filter((r) => r.status === "pending").length}
                </Text>
              </View>
            )}
            <Text className={`text-[10px] font-bold mt-1 ${realActiveTab === "requests" ? "text-[#a133b2]" : "text-slate-400"}`}>
              Requests
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setRealActiveTab("profile")} className="items-center py-1 flex-1">
            <Ionicons
              name={realActiveTab === "profile" ? "person" : "person-outline"}
              size={20}
              color={realActiveTab === "profile" ? "#a133b2" : "#94a3b8"}
            />
            <Text className={`text-[10px] font-bold mt-1 ${realActiveTab === "profile" ? "text-[#a133b2]" : "text-slate-400"}`}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ==================== DEFAULT DEMO MODE MAIN DASHBOARD ====================
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? "#020617" : "#f8fafc",
        paddingTop: topPaddingOffset,
      }}
      onLayout={handleLayout}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#020617" : "#f8fafc"}
        translucent={false}
      />
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top", "bottom", "left", "right"]}>
        <BackgroundBlobs />

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-8 pb-3 bg-transparent">
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 27, fontWeight: "900", color: "#a133b2", letterSpacing: -0.5 }}>
              Ripple
            </Text>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#a133b2", marginLeft: 3, marginTop: 16 }} />
          </View>

          <TouchableOpacity
            onPress={() => setCurrentMode(null)}
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"
          >
            <Ionicons name="exit-outline" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Search Input Container */}
        <View className="px-5 mb-5">
          <View className="flex-row items-center bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl">
            <Feather name="search" size={18} color="#a133b2" />
            <TextInput
              placeholder="Search conversations..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-[14.5px] text-slate-800 dark:text-slate-100 font-semibold py-0.5"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            ) : (
              <Feather name="mic" size={18} color="#94a3b8" />
            )}
          </View>
        </View>

        {/* Active Teammates Tray */}
        {filteredDemoUsers.filter((u) => onlineStatus[u.id]).length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-5 mb-3">
              <Text className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Active Teammates
              </Text>
              <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
            </View>
            <FlatList
              horizontal
              data={[
                // Inject the logged-in user at the beginning as "My Status"
                {
                  id: "me-status",
                  name: "My Note",
                  avatar: davidUser.avatar,
                  isMe: true,
                },
                ...filteredDemoUsers.filter((u) => onlineStatus[u.id]),
              ]}
              keyExtractor={(item) => `active-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              renderItem={({ item }) => {
                if (item.id === "me-status") {
                  return (
                    <TouchableOpacity activeOpacity={0.85} className="items-center mr-5">
                      <View className="relative">
                        <Image source={{ uri: item.avatar }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                        <View className="absolute bottom-0 right-0 bg-[#a133b2] w-5 h-5 rounded-full justify-center items-center border-2 border-slate-50 dark:border-slate-950">
                          <Feather name="plus" size={12} color="#ffffff" />
                        </View>
                      </View>
                      <Text className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-2 text-center">
                        My Note
                      </Text>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setActiveUser(item as User)}
                    className="items-center mr-5"
                  >
                    <View className="relative">
                      <Image source={{ uri: item.avatar }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                      <View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-slate-50 dark:border-slate-950" />
                    </View>
                    <Text
                      className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 mt-2 text-center max-w-[60px]"
                      numberOfLines={1}
                    >
                      {item.name.split(" ")[0]}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* Chats Feed List */}
        <FlatList
          data={filteredDemoUsers}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
          renderItem={({ item }) => {
            const { lastMessage, unreadCount, date } = getChatInfo(item);
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveUser(item)}
                className="flex-row items-center p-3.5 bg-white dark:bg-slate-900 rounded-2xl mb-3"
              >
                <View className="relative mr-3.5">
                  <Image source={{ uri: item.avatar }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                  {onlineStatus[item.id] && (
                    <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-1.5 border-white dark:border-slate-900" />
                  )}
                </View>

                <View className="flex-1 pr-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
                      {item.name}
                    </Text>
                    <Text className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      {date}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between mt-1">
                    <Text
                      numberOfLines={1}
                      className="flex-1 text-[12.5px] text-slate-500 dark:text-slate-400 font-medium mr-2"
                    >
                      {lastMessage}
                    </Text>
                    {unreadCount > 0 && (
                      <View
                        style={{
                          backgroundColor: "#a133b2",
                          minWidth: 18,
                          height: 18,
                          borderRadius: 9,
                          alignItems: "center",
                          justifyContent: "center",
                          paddingHorizontal: 4,
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
                          {unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}
