import { ListSkeleton } from "@/components/loading-screen";
import "@/global.css";
import { Feather, Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useAudioPlayer } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// --- Backend URL helper ---
const getBackendUrls = () => {
  let host = "localhost";
  if (Constants.expoConfig?.hostUri) {
    host = Constants.expoConfig.hostUri.split(':')[0];
  }
  return {
    api: `http://${host}:3000`,
    ws: `ws://${host}:3000`
  };
};

const URLS = getBackendUrls();
const API_URL = URLS.api;
const WS_URL = URLS.ws;

// --- Types ---
interface User {
  pin?: string;
  id: string;
  name: string;
  username?: string;
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

interface ChatRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  senderName: string;
  senderAvatar: string;
  receiverName?: string;
  receiverAvatar?: string;
  updatedAt?: string;
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
  }
];

const DAVID_USER: User = {
  id: "me",
  name: "David",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  ringColor: "#a133b2",
  lastSeen: "Active Now",
  unreadCount: 0,
  lastMessage: "",
  date: "",
};

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
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 350,
            useNativeDriver: Platform.OS !== "web",
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

const getHeaderDateString = () => {
  const date = new Date();
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const day = date.getDate();
  const year = date.getFullYear();
  return `${weekday} ${day}, ${year}`;
};

const timeAgo = (dateStr: string | Date | undefined): string => {
  if (!dateStr) return "";
  const now = new Date();
  const then = new Date(dateStr as string);
  const secs = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const getMessageDate = (item: ChatMessage) => {
  if (!item.id || item.id.length !== 24) {
    return new Date();
  }
  const sec = parseInt(item.id.substring(0, 8), 16);
  if (isNaN(sec)) {
    return new Date();
  }
  return new Date(sec * 1000);
};

const getDayString = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getDateSeparatorText = (date: Date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const dStr = date.toDateString();
  if (dStr === today.toDateString()) {
    return "TODAY";
  } else if (dStr === yesterday.toDateString()) {
    return "YESTERDAY";
  } else {
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    const day = date.getDate();
    const year = date.getFullYear();
    return `${weekday} ${day}, ${year}`;
  }
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const sendSoundPlayer = useAudioPlayer("https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav");
  const [loading, setLoading] = useState(!hasLoadedHome);
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [visibleHeight, setVisibleHeight] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS === "android") {
      const showSubscription = Keyboard.addListener("keyboardDidShow", (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      });
      const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
        setKeyboardHeight(0);
      });
      return () => {
        showSubscription.remove();
        hideSubscription.remove();
      };
    }
  }, []);

  const handleLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (initialHeight === 0 && height > 400) {
      setInitialHeight(height);
    }
    setVisibleHeight(height);
  };

  const isResized = initialHeight > 0 && visibleHeight > 0 && (initialHeight - visibleHeight > 100);
  const androidKeyboardPadding = keyboardHeight > 0 && !isResized ? keyboardHeight - insets.bottom : 0;

  const [searchQuery, setSearchQuery] = useState("");
  const [mockUsers, setMockUsers] = useState<User[]>(MOCK_USERS);
  const [davidUser, setDavidUser] = useState<User>(DAVID_USER);

  // Navigation State
  const [activeUser, setActiveUser] = useState<User | null>(null);

  // Perspectives / Switch States
  const [currentUser, setCurrentUser] = useState<string>("me"); // "me" (David) or partner ID

  // Drafts mapping: { "me": string, [partnerId]: string }
  const [draftText, setDraftText] = useState<Record<string, string>>({
    "me": "",
  });

  // Online statuses mapping: { "me": boolean, [partnerId]: boolean }
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({
    "me": true,
  });

  // Typing status mapping: { [userId]: boolean }
  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});

  // Custom message histories for different chats
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({});

  const flatListRef = useRef<FlatList>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastTypingState = useRef<Record<string, boolean>>({});

  // --- New App Modes & Auth States ---
  const [currentMode, setCurrentMode] = useState<null | "demo" | "auth" | "real">(null); // Starts on Welcome Screen (null)
  const [authScreen, setAuthScreen] = useState<"login" | "register">("login");
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  // Auth Form State
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPin, setFormPin] = useState("");
  const [authError, setAuthError] = useState("");

  // Real Mode State
  const [realActiveTab, setRealActiveTab] = useState<"chats" | "explore" | "requests" | "profile">("chats");
  const [exploreUsers, setExploreUsers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ChatRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [requestsSubTab, setRequestsSubTab] = useState<"incoming" | "sent">("incoming");
  const [realChats, setRealChats] = useState<User[]>([]);

  // Profile Edit Form State
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPin, setEditPin] = useState("");
  const [editAvatarUri, setEditAvatarUri] = useState("");
  const [editAvatarBase64, setEditAvatarBase64] = useState("");
  const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Sync Profile Edit inputs when loggedInUser is set or changed, or when switching to profile tab
  useEffect(() => {
    if (loggedInUser) {
      setEditName(loggedInUser.name || "");
      setEditUsername(loggedInUser.username || "");
      setEditPin(loggedInUser.pin || "");
      setEditAvatarUri(loggedInUser.avatar || "");
      setEditAvatarBase64("");
      setProfileMessage({ text: "", type: "" });
    }
  }, [loggedInUser, realActiveTab]);

  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setProfileMessage({ text: "Camera roll permissions are required to select a photo.", type: "error" });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setEditAvatarUri(asset.uri);
        if (asset.base64) {
          setEditAvatarBase64(`data:image/jpeg;base64,${asset.base64}`);
        }
      }
    } catch (err) {
      console.error("ImagePicker error:", err);
      setProfileMessage({ text: "Failed to pick an image.", type: "error" });
    }
  };

  const handleSaveProfile = () => {
    if (!loggedInUser) return;
    setProfileMessage({ text: "", type: "" });

    if (!editName.trim()) {
      setProfileMessage({ text: "Name cannot be empty.", type: "error" });
      return;
    }
    if (!editUsername.trim()) {
      setProfileMessage({ text: "Username cannot be empty.", type: "error" });
      return;
    }
    if (!editPin.trim()) {
      setProfileMessage({ text: "PIN cannot be empty.", type: "error" });
      return;
    }

    setProfileUpdating(true);

    const payload = {
      userId: loggedInUser.id,
      name: editName.trim(),
      username: editUsername.trim(),
      pin: editPin.trim(),
      avatarBase64: editAvatarBase64 || null,
    };

    fetch(`${API_URL}/api/profile/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const data = await res.json();
        setProfileUpdating(false);
        if (!res.ok) {
          setProfileMessage({ text: data.error || "Failed to update profile", type: "error" });
          return;
        }

        setLoggedInUser(data);
        setProfileMessage({ text: "Profile updated successfully!", type: "success" });
        setEditAvatarBase64("");

        fetchRealChats(data.id);
        fetchExploreUsers(data.id);
      })
      .catch((err) => {
        console.error("Save profile error:", err);
        setProfileUpdating(false);
        setProfileMessage({ text: "Server communication failed.", type: "error" });
      });
  };

  // Refs to prevent closure staleness in WebSocket listener
  const loggedInUserRef = useRef<User | null>(null);
  const currentModeRef = useRef<string | null>(null);

  useEffect(() => {
    loggedInUserRef.current = loggedInUser;
  }, [loggedInUser]);

  useEffect(() => {
    currentModeRef.current = currentMode;
  }, [currentMode]);

  // Fetch database seeded users on mount
  useEffect(() => {
    fetch(`${API_URL}/api/users`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMockUsers(data);
        }
      })
      .catch((err) => console.error("Error fetching users:", err));

    fetch(`${API_URL}/api/users/me`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.id) {
          setDavidUser(data);
        }
      })
      .catch((err) => console.error("Error fetching me profile:", err));
  }, []);

  // WebSocket connection & event synchronization
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWS = () => {
      socket = new WebSocket(WS_URL);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log("Connected to Ripple WebSocket server:", WS_URL);
        // Announce presence if already logged in when WS reconnects
        const currentUser = loggedInUserRef.current;
        if (currentUser) {
          socket?.send(JSON.stringify({ type: "REGISTER", userId: currentUser.id }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);

          if (parsed.type === "NEW_MESSAGE") {
            const { message } = parsed;
            const currentLogged = loggedInUserRef.current;
            const isReal = currentModeRef.current === "real" && currentLogged;
            const threadId = message.senderId === (isReal ? currentLogged.id : "me") ? message.partnerId : message.senderId;
            setConversations((prev) => {
              const currentList = prev[threadId] || [];
              if (currentList.some((m) => m.id === message.id)) {
                return prev;
              }

              // If there's an optimistic duplicate, replace it instead of appending
              const optIndex = currentList.findIndex(
                (m) => m.senderId === message.senderId && m.text === message.text && m.id.includes(".")
              );
              if (optIndex !== -1) {
                const newList = [...currentList];
                newList[optIndex] = message;
                return {
                  ...prev,
                  [threadId]: newList,
                };
              }

              return {
                ...prev,
                [threadId]: [...currentList, message],
              };
            });
          } else if (parsed.type === "TYPING_STATUS") {
            const { senderId, isTyping } = parsed;
            setTypingStatus((prev) => ({
              ...prev,
              [senderId]: isTyping,
            }));
          } else if (parsed.type === "ONLINE_STATUS") {
            const { userId, isOnline } = parsed;
            setOnlineStatus((prev) => ({
              ...prev,
              [userId]: isOnline,
            }));
          } else if (parsed.type === "REQUEST_UPDATE") {
            const { receiverId, senderId } = parsed;
            const currentLogged = loggedInUserRef.current;
            if (currentLogged && (currentLogged.id === receiverId || currentLogged.id === senderId)) {
              fetchPendingRequests(currentLogged.id);
              fetchSentRequests(currentLogged.id);
              fetchRealChats(currentLogged.id);
              fetchExploreUsers(currentLogged.id);
            }
          }
        } catch (err) {
          console.error("Error parsing WS message:", err);
        }
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed. Retrying in 3 seconds...");
        reconnectTimeout = setTimeout(() => {
          connectWS();
        }, 3000);
      };

      socket.onerror = (error) => {
        console.warn("WebSocket error:", error);
      };
    };

    connectWS();

    return () => {
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  // When loggedInUser is set (login), register presence over the open WS
  useEffect(() => {
    if (loggedInUser && wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: "REGISTER", userId: loggedInUser.id }));
    }
  }, [loggedInUser]);

  const fetchRealChats = (userId: string) => {
    fetch(`${API_URL}/api/users/chats/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRealChats(data);
      })
      .catch((err) => console.error("Error fetching chats:", err));
  };

  const fetchExploreUsers = (userId: string) => {
    fetch(`${API_URL}/api/users/explore/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setExploreUsers(data);
      })
      .catch((err) => console.error("Error fetching explore users:", err));
  };

  const fetchPendingRequests = (userId: string) => {
    fetch(`${API_URL}/api/requests/pending/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPendingRequests(data);
      })
      .catch((err) => console.error("Error fetching requests:", err));
  };

  const fetchSentRequests = (userId: string) => {
    fetch(`${API_URL}/api/requests/sent/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSentRequests(data);
      })
      .catch((err) => console.error("Error fetching sent requests:", err));
  };

  useEffect(() => {
    if (currentMode === "real" && loggedInUser) {
      if (realActiveTab === "chats") {
        fetchRealChats(loggedInUser.id);
      } else if (realActiveTab === "explore") {
        fetchExploreUsers(loggedInUser.id);
      } else if (realActiveTab === "requests") {
        fetchPendingRequests(loggedInUser.id);
        fetchSentRequests(loggedInUser.id);
      }
    }
  }, [currentMode, loggedInUser, realActiveTab]);

  const handleSendRequest = (receiverId: string) => {
    if (!loggedInUser) return;
    fetch(`${API_URL}/api/requests/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: loggedInUser.id,
        receiverId
      })
    })
      .then((res) => {
        if (res.ok) {
          setExploreUsers((prev) => prev.filter(u => u.id !== receiverId));
          fetchSentRequests(loggedInUser.id);
        }
      })
      .catch((err) => console.error("Error sending request:", err));
  };

  const handleRequestResponse = (requestId: string, status: "accepted" | "declined") => {
    if (!loggedInUser) return;
    fetch(`${API_URL}/api/requests/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        status
      })
    })
      .then((res) => {
        if (res.ok) {
          // Refresh so accepted ones show the "Connected" badge with timestamp
          fetchPendingRequests(loggedInUser.id);
          if (status === "accepted") {
            fetchRealChats(loggedInUser.id);
          }
        }
      })
      .catch((err) => console.error("Error responding to request:", err));
  };

  const handleCancelRequest = (requestId: string) => {
    if (!loggedInUser) return;
    fetch(`${API_URL}/api/requests/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    })
      .then((res) => {
        if (res.ok) {
          // Soft-update locally: mark as cancelled instead of removing
          setSentRequests((prev) =>
            prev.map((r) => r.id === requestId ? { ...r, status: "cancelled" } : r)
          );
        }
      })
      .catch((err) => console.error("Error cancelling request:", err));
  };

  const handleResendRequest = (requestId: string) => {
    if (!loggedInUser) return;
    fetch(`${API_URL}/api/requests/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    })
      .then((res) => {
        if (res.ok) {
          // Soft-update locally: mark back to pending
          setSentRequests((prev) =>
            prev.map((r) => r.id === requestId ? { ...r, status: "pending" } : r)
          );
        }
      })
      .catch((err) => console.error("Error re-sending request:", err));
  };

  const handleLogout = () => {
    // Broadcast offline status before clearing state
    if (loggedInUser && wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({
        type: "ONLINE_STATUS",
        userId: loggedInUser.id,
        isOnline: false,
      }));
    }
    // Reset all real-mode state
    setLoggedInUser(null);
    setRealChats([]);
    setPendingRequests([]);
    setSentRequests([]);
    setExploreUsers([]);
    setActiveUser(null);
    setRealActiveTab("chats");
    setCurrentMode(null); // Back to welcome screen
  };

  const handleAuthSubmit = () => {
    setAuthError("");
    if (!formUsername || !formPin) {
      setAuthError("Please fill out all fields.");
      return;
    }

    if (authScreen === "register") {
      if (!formName) {
        setAuthError("Please fill out all fields.");
        return;
      }
      fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          username: formUsername,
          pin: formPin
        })
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            setAuthError(data.error || "Registration failed");
            return;
          }
          setLoggedInUser(data);
          setCurrentMode("real");
          setFormName("");
          setFormUsername("");
          setFormPin("");
        })
        .catch(() => setAuthError("Server communication failed"));
    } else {
      fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formUsername,
          pin: formPin
        })
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            setAuthError(data.error || "Login failed");
            return;
          }
          setLoggedInUser(data);
          setCurrentMode("real");
          setFormName("");
          setFormUsername("");
          setFormPin("");
        })
        .catch(() => setAuthError("Server communication failed"));
    }
  };

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

  // Load message history from HTTP server on activeUser change
  useEffect(() => {
    if (activeUser) {
      const currentId = currentMode === "real" && loggedInUser ? loggedInUser.id : "me";
      fetch(`${API_URL}/api/messages/${activeUser.id}?currentUserId=${currentId}`)
        .then((res) => res.json())
        .then((data) => {
          setConversations((prev) => ({
            ...prev,
            [activeUser.id]: data,
          }));
        })
        .catch((err) => console.error("Error fetching messages:", err));

      setDraftText((prev) => ({
        ...prev,
        [activeUser.id]: prev[activeUser.id] || "",
      }));
      setOnlineStatus((prev) => ({
        ...prev,
        [activeUser.id]: prev[activeUser.id] !== undefined ? prev[activeUser.id] : true,
      }));
    }
    // Reset view perspective to David when entering/changing chat
    setCurrentUser("me");
  }, [activeUser]);

  const counterpartUser = currentMode === "real" && loggedInUser
    ? activeUser
    : (currentUser === "me" ? activeUser : davidUser);
  const isCounterpartOnline = counterpartUser ? onlineStatus[counterpartUser.id] : true;

  const showTypingIndicator =
    counterpartUser &&
    !!typingStatus[counterpartUser.id];

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
  }, [activeMessages, showTypingIndicator, activeUser, currentUser]);

  const sendTypingStatus = (senderId: string, isTyping: boolean) => {
    if (!activeUser) return;
    if (lastTypingState.current[senderId] === isTyping) return;
    lastTypingState.current[senderId] = isTyping;

    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(
        JSON.stringify({
          type: "TYPING_STATUS",
          partnerId: currentMode === "real" && loggedInUser
            ? activeUser.id
            : (senderId === "me" ? activeUser.id : "me"),
          senderId,
          isTyping,
        })
      );
    }
  };

  const handleDraftChange = (text: string) => {
    const activeSenderId = currentMode === "real" && loggedInUser ? loggedInUser.id : currentUser;
    setDraftText((prev) => ({ ...prev, [activeSenderId]: text }));
    const isTyping = text.trim().length > 0;
    sendTypingStatus(activeSenderId, isTyping);
  };

  const toggleOnline = () => {
    if (!counterpartUser) return;
    const newStatus = !onlineStatus[counterpartUser.id];

    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(
        JSON.stringify({
          type: "ONLINE_STATUS",
          userId: counterpartUser.id,
          isOnline: newStatus,
        })
      );
    }

    setOnlineStatus((prev) => ({
      ...prev,
      [counterpartUser.id]: newStatus,
    }));
  };

  const handleSend = () => {
    if (!activeUser) return;
    const activeSenderId = currentMode === "real" && loggedInUser ? loggedInUser.id : currentUser;
    const textToSend = draftText[activeSenderId] || "";
    if (!textToSend.trim()) return;

    // Play message sent sound chime
    try {
      sendSoundPlayer.seekTo(0);
      sendSoundPlayer.play();
    } catch (soundErr) {
      console.warn("Failed to play message sent sound:", soundErr);
    }

    const timeString = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const body = {
      partnerId: currentMode === "real" && loggedInUser
        ? activeUser.id
        : (currentUser === "me" ? activeUser.id : "me"),
      senderId: activeSenderId,
      type: "text",
      text: textToSend.trim(),
      timestamp: timeString,
    };

    // Optimistically update the UI locally
    const tempId = Math.random().toString();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: activeSenderId,
      type: "text",
      text: textToSend.trim(),
      timestamp: timeString,
    };

    setConversations((prev) => ({
      ...prev,
      [activeUser.id]: [...(prev[activeUser.id] || []), optimisticMsg],
    }));

    // Post message to HTTP server
    fetch(`${API_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then((savedMsg) => {
        setConversations((prev) => {
          const list = prev[activeUser.id] || [];
          // If already merged by the WS socket, just remove the temp message
          if (list.some((m) => m.id === savedMsg.id)) {
            return {
              ...prev,
              [activeUser.id]: list.filter((m) => m.id !== tempId),
            };
          }
          return {
            ...prev,
            [activeUser.id]: list.map((m) => (m.id === tempId ? savedMsg : m)),
          };
        });
      })
      .catch((err) => console.error("Error sending message:", err));

    setDraftText((prev) => ({ ...prev, [activeSenderId]: "" }));
    sendTypingStatus(activeSenderId, false);
  };

  const renderMessageItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isSent = item.senderId === (currentMode === "real" && loggedInUser ? loggedInUser.id : currentUser);
    const sender = isSent
      ? (currentMode === "real" && loggedInUser ? loggedInUser : davidUser)
      : activeUser;
    const isSenderOnline = sender ? (onlineStatus[sender.id] !== undefined ? onlineStatus[sender.id] : true) : true;
    const statusDotColor = isSenderOnline ? "#10b981" : "#94a3b8";

    // Show avatar if received, and it's the last message of a consecutive block from the sender
    const isLastInBlock = index === activeMessages.length - 1 || activeMessages[index + 1]?.senderId !== item.senderId;
    const showAvatar = !isSent && (item.showAvatar !== false && isLastInBlock);

    const itemDate = getMessageDate(item);
    const prevItem = index > 0 ? activeMessages[index - 1] : null;
    const showDateDivider = !prevItem || getDayString(getMessageDate(prevItem)) !== getDayString(itemDate);

    let messageBubble;
    if (item.type === "voice") {
      if (isSent) {
        messageBubble = (
          <View className="flex-row justify-end mb-4">
            <View style={{ borderTopRightRadius: 0, paddingHorizontal: 16, paddingVertical: 10 }} className="flex-row items-center bg-[#f4e5f6] rounded-2xl">
              <Waveform type={item.waveformType || 1} color="#a133b2" />
              <TouchableOpacity activeOpacity={0.7} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", marginLeft: 10 }}>
                <Ionicons name="play" size={12} color="#a133b2" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>
          </View>
        );
      } else {
        messageBubble = (
          <View className="flex-row justify-start mb-4 items-end">
            <View style={{ width: 32, height: 32, marginRight: 8, position: "relative" }}>
              {showAvatar && sender ? (
                <>
                  <Image source={{ uri: sender.avatar }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                  <View style={{ position: "absolute", top: -1, right: -1, width: 10, height: 10, borderRadius: 5, backgroundColor: statusDotColor, borderWidth: 1.5, borderColor: "#ffffff" }} />
                </>
              ) : null}
            </View>
            <View style={{ borderTopLeftRadius: 0, paddingHorizontal: 16, paddingVertical: 10 }} className="flex-row items-center bg-[#f0f0f3] dark:bg-slate-800 rounded-2xl">
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1e293b", marginTop: 4 }}>"</Text>
              </View>
              <Waveform type={item.waveformType || 2} color="#1e293b" />
            </View>
          </View>
        );
      }
    } else {
      messageBubble = (
        <View className={`flex-row mb-4 items-end ${isSent ? "justify-end" : "justify-start"}`}>
          {!isSent && (
            <View style={{ width: 32, height: 32, marginRight: 8, position: "relative" }}>
              {showAvatar && sender ? (
                <>
                  <Image source={{ uri: sender.avatar }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                  <View style={{ position: "absolute", top: -1, right: -1, width: 10, height: 10, borderRadius: 5, backgroundColor: statusDotColor, borderWidth: 1.5, borderColor: "#ffffff" }} />
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
    }

    return (
      <View key={item.id}>
        {showDateDivider && (
          <View className="items-center justify-center my-4">
            <Text className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              {getDateSeparatorText(itemDate)}
            </Text>
          </View>
        )}
        {messageBubble}
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
  if (activeUser && counterpartUser) {
    const activeSenderId = currentMode === "real" && loggedInUser ? loggedInUser.id : currentUser;
    return (
      <View style={{ flex: 1, backgroundColor: "#ffffff", paddingTop: topPaddingOffset }} onLayout={handleLayout}>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          backgroundColor={colorScheme === "dark" ? "#020617" : "#ffffff"}
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
              backgroundColor: "#ffffff",
              borderBottomWidth: 1,
              borderBottomColor: "#f1f5f9",
            }}
            className="dark:bg-slate-900 dark:border-slate-850"
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              {/* Back Button */}
              <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveUser(null)} className="p-1 mr-3">
                <Ionicons name="arrow-back" size={24} color="#1e293b" className="dark:text-slate-100" />
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
                    borderColor: "#ffffff",
                    borderRadius: 6,
                  }}
                />
              </View>

              {/* Title & Status */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text className="text-base font-bold text-slate-800 dark:text-slate-100 font-sans">{counterpartUser.name}</Text>

                  {/* Status Toggle Switch */}
                  <TouchableOpacity
                    onPress={toggleOnline}
                    className={`px-2 py-0.5 rounded-full border ${isCounterpartOnline
                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-955 dark:border-emerald-900"
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
                    backgroundColor: colorScheme === "dark" ? "#334155" : "#e2e8f0",
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
                  Selected User: {currentUser === "me" ? "David" : activeUser.name.split(" ")[0]}
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
            <FlatList
              ref={flatListRef}
              data={activeMessages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessageItem}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
              className="flex-1 bg-white dark:bg-slate-950"
              ListHeaderComponent={null}
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
            <View className="flex-row items-center px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#f5f5f7", borderRadius: 22, paddingHorizontal: 16, height: 44 }} className="dark:bg-slate-800">
                <TextInput
                  value={draftText[activeSenderId] || ""}
                  onChangeText={handleDraftChange}
                  onSubmitEditing={handleSend}
                  placeholder={
                    currentMode === "real" && loggedInUser
                      ? `Send as ${loggedInUser.name.split(" ")[0]}...`
                      : `Send as ${currentUser === "me" ? "David" : activeUser.name.split(" ")[0]}...`
                  }
                  placeholderTextColor="#94a3b8"
                  style={{ flex: 1, color: "#1e293b", fontSize: 15, paddingVertical: 8 }}
                  className="dark:text-slate-100"
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleSend}
                  disabled={!(draftText[activeSenderId] || "").trim()}
                  style={{ padding: 4 }}
                >
                  <Feather name="send" size={18} color={(draftText[activeSenderId] || "").trim() ? "#a133b2" : "#94a3b8"} />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // ==================== 1. WELCOME SCREEN ====================
  if (currentMode === null) {
    return (
      <View style={{ flex: 1, backgroundColor: "#ffffff" }} onLayout={handleLayout}>
        <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 justify-center items-center px-6">
          <View className="items-center mb-12">
            <Text className="text-5xl font-black text-[#a133b2] tracking-tighter">
              Ripple
            </Text>
            <Text className="text-sm text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-2">
              Connect Securely
            </Text>
          </View>

          <View className="w-full bg-[#f8fafc] dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 gap-4 mb-8" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
            <Text className="text-lg font-bold text-slate-700 dark:text-slate-200 text-center mb-2">
              Welcome to Ripple!
            </Text>
            <Text className="text-xs text-slate-400 dark:text-slate-400 text-center leading-5 mb-4">
              Enter Demo Mode to test the UI interactions, or Login/Register to connect with other registered users in real-time.
            </Text>

            {/* Login Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setAuthScreen("login");
                setCurrentMode("auth");
              }}
              className="bg-[#a133b2] py-3.5 rounded-2xl items-center"
              style={{ shadowColor: "#a133b2", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 }}
            >
              <Text className="text-white font-bold text-sm">
                Login / Register
              </Text>
            </TouchableOpacity>

            {/* Demo Mode Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setCurrentMode("demo");
              }}
              className="bg-transparent py-3.5 rounded-2xl items-center border border-purple-200 dark:border-purple-800"
            >
              <Text className="text-[#a133b2] dark:text-purple-400 font-bold text-sm">
                Explore Demo Mode
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-[10px] text-slate-400 font-medium absolute bottom-8">
            Ripple Messaging App v1.0.0
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  // ==================== 2. AUTH SCREEN (LOGIN/REGISTER) ====================
  if (currentMode === "auth") {
    return (
      <View style={{ flex: 1, backgroundColor: "#ffffff" }} onLayout={handleLayout}>
        <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
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
                paddingVertical: 24,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="mb-8 items-center">
                <Text className="text-3xl font-black text-[#a133b2] tracking-tighter">
                  Ripple
                </Text>
                <Text className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                  {authScreen === "login" ? "Welcome Back" : "Create Account"}
                </Text>
              </View>

              <View className="bg-[#f8fafc] dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 gap-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                {authError ? (
                  <Text className="text-xs text-red-500 font-bold text-center bg-red-50 dark:bg-red-950 p-2.5 rounded-xl border border-red-200 dark:border-red-900">
                    {authError}
                  </Text>
                ) : null}

                {authScreen === "register" && (
                  <View className="gap-1.5">
                    <Text className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                      Full Name
                    </Text>
                    <TextInput
                      value={formName}
                      onChangeText={setFormName}
                      placeholder="e.g. John Doe"
                      placeholderTextColor="#94a3b8"
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-medium"
                    />
                  </View>
                )}

                <View className="gap-1.5">
                  <Text className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                    Username
                  </Text>
                  <TextInput
                    value={formUsername}
                    onChangeText={setFormUsername}
                    autoCapitalize="none"
                    placeholder="e.g. johndoe"
                    placeholderTextColor="#94a3b8"
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-medium"
                  />
                </View>

                <View className="gap-1.5">
                  <Text className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                    Security PIN
                  </Text>
                  <TextInput
                    value={formPin}
                    onChangeText={setFormPin}
                    secureTextEntry
                    keyboardType="numeric"
                    placeholder="e.g. 1234"
                    placeholderTextColor="#94a3b8"
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-medium"
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleAuthSubmit}
                  className="bg-[#a133b2] py-3.5 rounded-2xl items-center mt-2"
                  style={{ shadowColor: "#a133b2", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 }}
                >
                  <Text className="text-white font-bold text-sm">
                    {authScreen === "login" ? "Login" : "Sign Up"}
                  </Text>
                </TouchableOpacity>

                <View className="flex-row justify-between mt-4 px-1">
                  <TouchableOpacity
                    onPress={() => {
                      setAuthError("");
                      setAuthScreen(authScreen === "login" ? "register" : "login");
                    }}
                  >
                    <Text className="text-xs text-[#a133b2] dark:text-purple-400 font-bold">
                      {authScreen === "login" ? "Need an account? Register" : "Have an account? Login"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setAuthError("");
                      setCurrentMode(null);
                    }}
                  >
                    <Text className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // ==================== 3. REAL MODE DASHBOARD ====================
  if (currentMode === "real") {
    const filteredRealUsers = (realActiveTab === "chats" ? realChats : exploreUsers).filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={{ flex: 1, backgroundColor: "#ffffff", paddingTop: topPaddingOffset }} onLayout={handleLayout}>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          backgroundColor={colorScheme === "dark" ? "#020617" : "#ffffff"}
          translucent={false}
        />
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top", "bottom", "left", "right"]}>
          {/* Real Mode Header */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-3 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-850">
            <View className="flex-row items-center gap-3">
              <Image source={{ uri: loggedInUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" }} style={{ width: 36, height: 36, borderRadius: 18 }} />
              <View>
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">{loggedInUser?.name}</Text>
                <Text className="text-[10px] text-slate-400 font-semibold">@{loggedInUser?.username}</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <Text className="text-xs font-extrabold text-[#a133b2] bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">REAL MODE</Text>
            </View>
          </View>

          {/* Search Input (only for Chats and Explore) */}
          {realActiveTab !== "requests" && realActiveTab !== "profile" && (
            <View className="px-5 mt-4 mb-2">
              <View className="flex-row items-center bg-[#f5f5f7] dark:bg-slate-800 px-4 py-1.5 rounded-full">
                <Ionicons name="search" size={18} color="#a133b2" />
                <TextInput
                  placeholder="Search here.."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 ml-3 text-[14.5px] text-slate-800 dark:text-slate-100 py-1"
                />
              </View>
            </View>
          )}

          {/* Main Content Area */}
          <View className="flex-1 px-5 mt-2">
            {realActiveTab === "chats" && (
              filteredRealUsers.length === 0 ? (
                <View className="flex-1 justify-center items-center px-4">
                  <Ionicons name="chatbubbles-outline" size={48} color="#94a3b8" />
                  <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-4 text-center leading-5">
                    No active chats yet.{"\n"}Go to the Explore tab to find users and start chatting!
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredRealUsers}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setActiveUser(item)}
                      className="flex-row items-center py-3.5 border-b border-slate-50 dark:border-slate-850"
                    >
                      <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: item.ringColor, padding: 1.5, marginRight: 14 }}>
                        <Image source={{ uri: item.avatar }} style={{ width: "100%", height: "100%", borderRadius: 20 }} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[14.5px] font-bold text-slate-855 dark:text-slate-100">{item.name}</Text>
                        <Text numberOfLines={1} className="text-xs text-slate-400 mt-0.5">@{item.username}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                />
              )
            )}

            {realActiveTab === "explore" && (
              filteredRealUsers.length === 0 ? (
                <View className="flex-1 justify-center items-center px-4">
                  <Ionicons name="compass-outline" size={48} color="#94a3b8" />
                  <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-4 text-center">
                    No new users to explore right now.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredRealUsers}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View className="flex-row items-center py-3.5 border-b border-slate-50 dark:border-slate-855">
                      <Image source={{ uri: item.avatar }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 14 }} />
                      <View className="flex-1">
                        <Text className="text-[14.5px] font-bold text-slate-855 dark:text-slate-100">{item.name}</Text>
                        <Text className="text-xs text-slate-400 mt-0.5">@{item.username}</Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleSendRequest(item.id)}
                        className="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-800 px-3.5 py-1.5 rounded-full"
                      >
                        <Text className="text-xs font-bold text-[#a133b2] dark:text-purple-300">Request</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )
            )}

            {realActiveTab === "requests" && (
              <View className="flex-1">
                {/* Segmented Selector */}
                <View className="flex-row bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4">
                  <TouchableOpacity
                    onPress={() => setRequestsSubTab("incoming")}
                    className={`flex-1 py-2 rounded-lg items-center ${requestsSubTab === "incoming" ? "bg-white dark:bg-slate-900" : ""}`}
                    style={requestsSubTab === "incoming" ? { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } as any : undefined}
                  >
                    <Text className={`text-xs font-bold ${requestsSubTab === "incoming" ? "text-[#a133b2]" : "text-slate-500"}`}>
                      Incoming ({pendingRequests.length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setRequestsSubTab("sent")}
                    className={`flex-1 py-2 rounded-lg items-center ${requestsSubTab === "sent" ? "bg-white dark:bg-slate-900" : ""}`}
                    style={requestsSubTab === "sent" ? { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } as any : undefined}
                  >
                    <Text className={`text-xs font-bold ${requestsSubTab === "sent" ? "text-[#a133b2]" : "text-slate-500"}`}>
                      Sent ({sentRequests.length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {requestsSubTab === "incoming" ? (
                  pendingRequests.length === 0 ? (
                    <View className="flex-1 justify-center items-center px-4">
                      <Ionicons name="people-outline" size={48} color="#94a3b8" />
                      <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-4 text-center">
                        No pending chat requests.
                      </Text>
                    </View>
                  ) : (
                    <FlatList
                      data={pendingRequests}
                      keyExtractor={(item) => item.id}
                      showsVerticalScrollIndicator={false}
                      renderItem={({ item }) => (
                        <View className="flex-row items-center py-3.5 border-b border-slate-50 dark:border-slate-855">
                          <Image source={{ uri: item.senderAvatar }} style={{ width: 46, height: 46, borderRadius: 23, marginRight: 14 }} />
                          <View className="flex-1">
                            <Text className="text-[14.5px] font-bold text-slate-800 dark:text-slate-100">{item.senderName}</Text>
                            {item.status === "accepted" ? (
                              <View className="flex-row items-center gap-1.5 mt-0.5">
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981" }} />
                                <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                  Connected · {timeAgo(item.updatedAt)}
                                </Text>
                              </View>
                            ) : (
                              <Text className="text-xs text-slate-400 mt-0.5">wants to connect</Text>
                            )}
                          </View>
                          {item.status === "pending" && (
                            <View className="flex-row gap-2">
                              <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleRequestResponse(item.id, "accepted")}
                                className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 px-3 py-1.5 rounded-full"
                              >
                                <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleRequestResponse(item.id, "declined")}
                                className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-full"
                              >
                                <Text className="text-xs font-bold text-red-500 dark:text-red-400">Decline</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                          {item.status === "accepted" && (
                            <View className="bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                              <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Connected</Text>
                            </View>
                          )}
                        </View>
                      )}
                    />
                  )
                ) : (
                  sentRequests.length === 0 ? (
                    <View className="flex-1 justify-center items-center px-4">
                      <Ionicons name="paper-plane-outline" size={48} color="#94a3b8" />
                      <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-4 text-center">
                        No requests sent yet.
                      </Text>
                    </View>
                  ) : (
                    <FlatList
                      data={sentRequests}
                      keyExtractor={(item) => item.id}
                      showsVerticalScrollIndicator={false}
                      renderItem={({ item }) => {
                        const isCancelled = item.status === "cancelled";
                        const isAccepted = item.status === "accepted";
                        return (
                          <View
                            className="flex-row items-center py-3.5 border-b border-slate-50 dark:border-slate-800"
                            style={isCancelled ? { opacity: 0.65 } : undefined}
                          >
                            <View style={{ position: "relative", marginRight: 14 }}>
                              <Image source={{ uri: item.receiverAvatar }} style={{ width: 46, height: 46, borderRadius: 23 }} />
                              {isCancelled && (
                                <View style={{
                                  position: "absolute", top: -2, right: -2,
                                  width: 16, height: 16, borderRadius: 8,
                                  backgroundColor: "#94a3b8",
                                  alignItems: "center", justifyContent: "center",
                                  borderWidth: 1.5, borderColor: "#ffffff",
                                }}>
                                  <Ionicons name="close" size={9} color="#fff" />
                                </View>
                              )}
                            </View>
                            <View className="flex-1">
                              <Text className="text-[14.5px] font-bold text-slate-800 dark:text-slate-100">{item.receiverName}</Text>
                              {isAccepted ? (
                                <View className="flex-row items-center gap-1.5 mt-0.5">
                                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981" }} />
                                  <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                    Accepted · {timeAgo(item.updatedAt)}
                                  </Text>
                                </View>
                              ) : isCancelled ? (
                                <Text className="text-xs text-slate-400 mt-0.5">Cancelled · {timeAgo(item.updatedAt)}</Text>
                              ) : (
                                <Text className="text-xs text-slate-400 mt-0.5">Pending approval</Text>
                              )}
                            </View>
                            {item.status === "pending" && (
                              <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleCancelRequest(item.id)}
                                className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-full"
                              >
                                <Text className="text-xs font-bold text-red-500 dark:text-red-400">Cancel</Text>
                              </TouchableOpacity>
                            )}
                            {isCancelled && (
                              <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleResendRequest(item.id)}
                                style={{
                                  backgroundColor: "#f5e6f8",
                                  borderWidth: 1,
                                  borderColor: "#e0b3f0",
                                  paddingHorizontal: 12,
                                  paddingVertical: 6,
                                  borderRadius: 20,
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Ionicons name="refresh" size={11} color="#a133b2" />
                                <Text style={{ fontSize: 11, fontWeight: "800", color: "#a133b2" }}>Re-send</Text>
                              </TouchableOpacity>
                            )}
                            {isAccepted && (
                              <View className="bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                                <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Connected</Text>
                              </View>
                            )}
                          </View>
                        );
                      }}
                    />
                  )
                )}
              </View>
            )}

            {realActiveTab === "profile" && (
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1, paddingBottom: Platform.OS === "android" ? androidKeyboardPadding : 0 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 140 : 0}
              >
                <FlatList
                  data={[{ id: "profile-form" }]}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 30 }}
                  renderItem={() => (
                    <View className="gap-6 mt-2">
                      {/* Centered Avatar Edit */}
                      <View className="items-center">
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={handlePickAvatar}
                          style={{ position: "relative" }}
                        >
                          <View
                            style={{
                              width: 110,
                              height: 110,
                              borderRadius: 55,
                              borderWidth: 3,
                              borderColor: "#a133b2",
                              padding: 3,
                              backgroundColor: "#f8fafc",
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.1,
                              shadowRadius: 3,
                              elevation: 3,
                            }}
                            className="dark:bg-slate-900 justify-center items-center"
                          >
                            <Image
                              source={{ uri: editAvatarUri || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" }}
                              style={{ width: "100%", height: "100%", borderRadius: 50 }}
                            />
                          </View>
                          <View
                            style={{
                              position: "absolute",
                              bottom: 0,
                              right: 0,
                              backgroundColor: "#a133b2",
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              justifyContent: "center",
                              alignItems: "center",
                              borderWidth: 2,
                              borderColor: "#ffffff",
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.15,
                              shadowRadius: 1.5,
                              elevation: 2,
                            }}
                          >
                            <Feather name="camera" size={14} color="#ffffff" />
                          </View>
                        </TouchableOpacity>
                        <Text className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-3">
                          Tap photo to change
                        </Text>
                      </View>

                      {/* Status Message */}
                      {profileMessage.text ? (
                        <View
                          className={`p-3.5 rounded-xl border items-center ${profileMessage.type === "success"
                            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-955 dark:border-emerald-900"
                            : "bg-red-50 border-red-200 dark:bg-red-955 dark:border-red-900"
                            }`}
                        >
                          <Text
                            className={`text-xs font-bold text-center ${profileMessage.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                              }`}
                          >
                            {profileMessage.text}
                          </Text>
                        </View>
                      ) : null}

                      {/* Form Fields Container */}
                      <View className="bg-[#f8fafc] dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 gap-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                        {/* Name field */}
                        <View className="gap-1.5">
                          <Text className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                            Full Name
                          </Text>
                          <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Full Name"
                            placeholderTextColor="#94a3b8"
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-semibold"
                          />
                        </View>

                        {/* Username field */}
                        <View className="gap-1.5">
                          <Text className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                            Username
                          </Text>
                          <TextInput
                            value={editUsername}
                            onChangeText={setEditUsername}
                            autoCapitalize="none"
                            placeholder="username"
                            placeholderTextColor="#94a3b8"
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-semibold"
                          />
                        </View>

                        {/* Security PIN field */}
                        <View className="gap-1.5">
                          <Text className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                            Security PIN
                          </Text>
                          <View style={{ position: "relative" }} className="justify-center">
                            <TextInput
                              value={editPin}
                              onChangeText={setEditPin}
                              secureTextEntry={!showPin}
                              keyboardType="numeric"
                              placeholder="PIN"
                              placeholderTextColor="#94a3b8"
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-4 pr-12 py-3 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-semibold"
                            />
                            <TouchableOpacity
                              onPress={() => setShowPin(!showPin)}
                              style={{ position: "absolute", right: 12, padding: 4 }}
                            >
                              <Ionicons
                                name={showPin ? "eye-off-outline" : "eye-outline"}
                                size={20}
                                color="#94a3b8"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View className="gap-3">
                        {/* Save Button */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={handleSaveProfile}
                          disabled={profileUpdating}
                          className="bg-[#a133b2] py-3.5 rounded-2xl items-center"
                          style={{ shadowColor: "#a133b2", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 }}
                        >
                          <Text className="text-white font-bold text-sm">
                            {profileUpdating ? "Saving Changes..." : "Save Changes"}
                          </Text>
                        </TouchableOpacity>

                        {/* Cancel / Back to Chats */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setRealActiveTab("chats")}
                          className="bg-transparent py-3.5 rounded-2xl items-center border border-slate-200 dark:border-slate-800"
                        >
                          <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                            Back to Chats
                          </Text>
                        </TouchableOpacity>

                        {/* Logout */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={handleLogout}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            backgroundColor: "#fff1f2",
                            borderWidth: 1,
                            borderColor: "#fecdd3",
                            paddingVertical: 14,
                            borderRadius: 16,
                          }}
                        >
                          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                          <Text style={{ color: "#ef4444", fontWeight: "800", fontSize: 14 }}>
                            Log Out
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />
              </KeyboardAvoidingView>
            )}
          </View>

          {/* Custom Bottom Tab Bar */}
          <View className="flex-row bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-2.5 px-4 justify-around">
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

            <TouchableOpacity onPress={() => setRealActiveTab("requests")} className="items-center py-1 flex-1" style={{ position: "relative" }}>
              <Ionicons
                name={realActiveTab === "requests" ? "people" : "people-outline"}
                size={22}
                color={realActiveTab === "requests" ? "#a133b2" : "#94a3b8"}
              />
              {pendingRequests.filter(r => r.status === "pending").length > 0 && (
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
                    {pendingRequests.filter(r => r.status === "pending").length}
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
        </SafeAreaView>
      </View>
    );
  }

  // ==================== 4. DEFAULT DEMO MODE MAIN DASHBOARD ====================
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff", paddingTop: topPaddingOffset }} onLayout={handleLayout}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colorScheme === "dark" ? "#020617" : "#ffffff"}
        translucent={false}
      />
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top", "bottom", "left", "right"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-850">
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

        {/* Search Input */}
        <View className="px-5 mt-4 mb-4">
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
                  <Text className="text-[15px] font-bold text-slate-855 dark:text-slate-100">
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