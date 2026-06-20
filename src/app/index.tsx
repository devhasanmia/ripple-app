import { ListSkeleton } from "@/components/loading-screen";
import "@/global.css";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  Modal
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Waveform } from "@/components/waveform";
import { API_URL, WS_URL } from "@/constants/config";
import { ChatMessage, ChatRequest, User } from "@/types";
import {
  getDateSeparatorText,
  getDayString,
  getMessageDate,
  timeAgo
} from "@/utils/date";

import { AuthScreen } from "@/components/auth-screen";
import { BackgroundBlobs } from "@/components/background-blobs";
import { ChatRoom } from "@/components/chat-room";
import { WelcomeScreen } from "@/components/welcome-screen";

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
    id: "sarah-connor",
    name: "Sarah Connor",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    ringColor: "#3b82f6",
    lastSeen: "Active Now",
    unreadCount: 0,
    lastMessage: "Great! Let's catch up tomorrow.",
    date: "04 Jan",
  },
  {
    id: "james-smith",
    name: "James Smith",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    ringColor: "#10b981",
    lastSeen: "Active Now",
    unreadCount: 1,
    lastMessage: "Hey, can you send that file?",
    date: "03 Jan",
  },
  {
    id: "emily-watson",
    name: "Emily Watson",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    ringColor: "#f59e0b",
    lastSeen: "2h ago",
    unreadCount: 0,
    lastMessage: "Thanks for the call.",
    date: "02 Jan",
  },
  {
    id: "alex-mercer",
    name: "Alex Mercer",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    ringColor: "#a133b2",
    lastSeen: "Active Now",
    unreadCount: 0,
    lastMessage: "Check out the new design!",
    date: "01 Jan",
  },
  {
    id: "sophia-davis",
    name: "Sophia Davis",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    ringColor: "#ec4899",
    lastSeen: "Active Now",
    unreadCount: 3,
    lastMessage: "Are you coming tonight?",
    date: "31 Dec",
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

const SARAH_CONVERSATION: ChatMessage[] = [
  { id: "s1", senderId: "sarah-connor", type: "text", text: "Hey David! Are we still meeting?", timestamp: "3:40 PM", showAvatar: true },
  { id: "s2", senderId: "me", type: "text", text: "Hey Sarah, yes, 4 PM works for me.", timestamp: "3:42 PM" },
  { id: "s3", senderId: "sarah-connor", type: "text", text: "Great! Let's catch up tomorrow.", timestamp: "3:45 PM", showAvatar: true }
];

const JAMES_CONVERSATION: ChatMessage[] = [
  { id: "j1", senderId: "james-smith", type: "text", text: "Hey, can you send that file?", timestamp: "1:15 PM", showAvatar: true },
  { id: "j2", senderId: "me", type: "text", text: "Sure, let me upload it.", timestamp: "1:20 PM" }
];

let hasLoadedHome = false;

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
    "daniel-mercer": true,
    "sarah-connor": true,
    "james-smith": true,
    "alex-mercer": true,
    "sophia-davis": true,
    "emily-watson": false,
  });

  // Typing status mapping: { [userId]: boolean }
  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});

  // Custom message histories for different chats
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({
    "daniel-mercer": DANIEL_CONVERSATION,
    "sarah-connor": SARAH_CONVERSATION,
    "james-smith": JAMES_CONVERSATION,
  });

  const flatListRef = useRef<FlatList>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastTypingState = useRef<Record<string, boolean>>({});

  // --- New App Modes & Auth States ---
  const [currentMode, setCurrentMode] = useState<null | "demo" | "auth" | "real">(null); // Starts on Welcome Screen (null)
  const [authScreen, setAuthScreen] = useState<"login" | "register">("login");
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [activeFullscreenImage, setActiveFullscreenImage] = useState<string | null>(null);

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
                (m) =>
                  m.senderId === message.senderId &&
                  m.id.includes(".") &&
                  (message.type === "image" ? m.type === "image" : m.text === message.text)
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
    !!counterpartUser &&
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

  const handleSendImage = (localUri: string, base64Uri: string) => {
    if (!activeUser) return;
    const activeSenderId = currentMode === "real" && loggedInUser ? loggedInUser.id : currentUser;

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
      type: "image",
      imageUri: base64Uri,
      timestamp: timeString,
    };

    // Optimistically update the UI locally with the local file path (faster display)
    const tempId = Math.random().toString();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: activeSenderId,
      type: "image",
      imageUri: localUri,
      timestamp: timeString,
    };

    setConversations((prev) => ({
      ...prev,
      [activeUser.id]: [...(prev[activeUser.id] || []), optimisticMsg],
    }));

    if (currentMode === "real") {
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
        .catch((err) => console.error("Error sending image message:", err));
    }
  };

  const handlePickChatImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need access to your photos to send images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const localUri = asset.uri;
      const base64Data = asset.base64;

      if (!base64Data) {
        Alert.alert("Error", "Could not read the selected image.");
        return;
      }

      const imageBase64Uri = `data:image/jpeg;base64,${base64Data}`;
      handleSendImage(localUri, imageBase64Uri);
    } catch (err) {
      console.error("Image picking error:", err);
      Alert.alert("Error", "An error occurred while picking the image.");
    }
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
            <View style={{ borderTopRightRadius: 0, paddingHorizontal: 16, paddingVertical: 10 }} className="flex-col bg-[#f4e5f6] rounded-2xl">
              <View className="flex-row items-center">
                <Waveform type={item.waveformType || 1} color="#a133b2" />
                <TouchableOpacity activeOpacity={0.7} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", marginLeft: 10 }}>
                  <Ionicons name="play" size={12} color="#a133b2" style={{ marginLeft: 2 }} />
                </TouchableOpacity>
              </View>
              {item.timestamp ? (
                <Text style={{ alignSelf: "flex-end", fontSize: 9, opacity: 0.65, marginTop: 4 }} className="text-[#a133b2] font-semibold">
                  {item.timestamp}
                </Text>
              ) : null}
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
            <View style={{ borderTopLeftRadius: 0, paddingHorizontal: 16, paddingVertical: 10 }} className="flex-col bg-[#f0f0f3] dark:bg-slate-800 rounded-2xl">
              <View className="flex-row items-center">
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1e293b", marginTop: 4 }}>"</Text>
                </View>
                <Waveform type={item.waveformType || 2} color="#1e293b" />
              </View>
              {item.timestamp ? (
                <Text style={{ alignSelf: "flex-end", fontSize: 9, opacity: 0.5, marginTop: 4 }} className="text-slate-500 dark:text-slate-400 font-semibold">
                  {item.timestamp}
                </Text>
              ) : null}
            </View>
          </View>
        );
      }
    } else if (item.type === "image") {
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

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => item.imageUri && setActiveFullscreenImage(item.imageUri)}
            style={isSent ? { borderTopRightRadius: 0, padding: 4 } : { borderTopLeftRadius: 0, padding: 4 }}
            className={`max-w-[75%] rounded-2xl flex-col relative overflow-hidden ${isSent ? "bg-[#f4e5f6]" : "bg-[#f0f0f3] dark:bg-slate-800"}`}
          >
            <Image
              source={{ uri: item.imageUri }}
              style={{ width: 220, height: 160, borderRadius: 12 }}
              contentFit="cover"
            />
            {item.timestamp ? (
              <View 
                style={{ 
                  position: "absolute", 
                  bottom: 8, 
                  right: 8, 
                  backgroundColor: "rgba(0,0,0,0.55)", 
                  paddingHorizontal: 6, 
                  paddingVertical: 2, 
                  borderRadius: 6 
                }}
              >
                <Text style={{ fontSize: 9, color: "#ffffff", fontWeight: "600" }}>
                  {item.timestamp}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      );
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
            className={`max-w-[75%] rounded-2xl flex-col ${isSent ? "bg-[#f4e5f6]" : "bg-[#f0f0f3] dark:bg-slate-800"}`}
          >
            <Text
              className={`text-[15px] leading-5 ${isSent ? "text-[#a133b2] font-semibold" : "text-slate-800 dark:text-slate-100"}`}
            >
              {item.text}
            </Text>
            {item.timestamp ? (
              <Text
                style={{ alignSelf: "flex-end", fontSize: 9, opacity: isSent ? 0.65 : 0.5, marginTop: 4 }}
                className={isSent ? "text-[#a133b2] font-semibold" : "text-slate-500 dark:text-slate-400 font-semibold"}
              >
                {item.timestamp}
              </Text>
            ) : null}
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
  // --- SUB-SCREEN: CHAT ROOM SCREEN (If activeUser is selected) ---
  if (activeUser && counterpartUser) {
    return (
      <>
        <ChatRoom
          activeUser={activeUser}
          counterpartUser={counterpartUser}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          davidUser={davidUser}
          loggedInUser={loggedInUser}
          currentMode={currentMode}
          activeMessages={activeMessages}
          renderMessageItem={renderMessageItem}
          showTypingIndicator={showTypingIndicator}
          draftText={draftText}
          handleDraftChange={handleDraftChange}
          handleSend={handleSend}
          toggleOnline={toggleOnline}
          isCounterpartOnline={isCounterpartOnline}
          colorScheme={colorScheme}
          handleLayout={handleLayout}
          androidKeyboardPadding={androidKeyboardPadding}
          topPaddingOffset={topPaddingOffset}
          onBack={() => {
            setActiveUser(null);
            setShowEmojiTray(false);
          }}
          flatListRef={flatListRef}
          handlePickChatImage={handlePickChatImage}
          showEmojiTray={showEmojiTray}
          setShowEmojiTray={setShowEmojiTray}
        />

        {/* Full-Screen Image Viewer Modal */}
        <Modal
          visible={activeFullscreenImage !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setActiveFullscreenImage(null)}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.95)", justifyContent: "center", alignItems: "center" }}>
            {activeFullscreenImage && (
              <>
                {/* Back / Close button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setActiveFullscreenImage(null)}
                  style={{
                    position: "absolute",
                    top: 50,
                    left: 20,
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                  }}
                >
                  <Feather name="x" size={24} color="#ffffff" />
                </TouchableOpacity>

                {/* The Image itself */}
                <Image
                  source={{ uri: activeFullscreenImage }}
                  style={{
                    width: "90%",
                    height: "70%",
                  }}
                  contentFit="contain"
                />
              </>
            )}
          </View>
        </Modal>
      </>
    );
  }

  // ==================== 1. WELCOME SCREEN ====================
  if (currentMode === null) {
    return (
      <WelcomeScreen
        colorScheme={colorScheme}
        handleLayout={handleLayout}
        onEnterAuth={() => {
          setAuthScreen("login");
          setCurrentMode("auth");
        }}
        onEnterDemoMode={() => {
          setCurrentMode("demo");
        }}
      />
    );
  }

  // ==================== 2. AUTH SCREEN (LOGIN/REGISTER) ====================
  if (currentMode === "auth") {
    return (
      <AuthScreen
        authScreen={authScreen}
        setAuthScreen={setAuthScreen}
        formName={formName}
        setFormName={setFormName}
        formUsername={formUsername}
        setFormUsername={setFormUsername}
        formPin={formPin}
        setFormPin={setFormPin}
        authError={authError}
        setAuthError={setAuthError}
        onSubmit={handleAuthSubmit}
        onCancel={() => {
          setAuthError("");
          setCurrentMode(null);
        }}
        colorScheme={colorScheme}
        handleLayout={handleLayout}
        androidKeyboardPadding={androidKeyboardPadding}
      />
    );
  }

  // ==================== 3. REAL MODE DASHBOARD ====================
  if (currentMode === "real") {
    const filteredRealUsers = (realActiveTab === "chats" ? realChats : exploreUsers).filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={{ flex: 1, backgroundColor: colorScheme === "dark" ? "#020617" : "#ffffff", paddingTop: topPaddingOffset }} onLayout={handleLayout}>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          backgroundColor={colorScheme === "dark" ? "#020617" : "#ffffff"}
          translucent={false}
        />
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top", "bottom", "left", "right"]}>
          <BackgroundBlobs />

          {/* Real Mode Header */}
          <View className="flex-row items-center justify-between px-5 pt-8 pb-3 bg-transparent">
            <View className="flex-row items-center gap-3">
              <Image source={{ uri: loggedInUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" }} style={{ width: 38, height: 38, borderRadius: 19 }} />
              <View>
                <Text className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{loggedInUser?.name}</Text>
                <Text className="text-[10px] text-slate-400 font-semibold">@{loggedInUser?.username}</Text>
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
              filteredRealUsers.length === 0 ? (
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
                        ...realChats.filter(u => onlineStatus[u.id])
                      ]}
                      keyExtractor={(item) => `active-${item.id}`}
                      showsHorizontalScrollIndicator={false}
                      renderItem={({ item }) => {
                        if (item.isMe) {
                          return (
                            <TouchableOpacity
                              activeOpacity={0.85}
                              className="items-center mr-5"
                            >
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
                            <Text className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 mt-2 text-center max-w-[60px]" numberOfLines={1}>
                              {item.name.split(" ")[0]}
                            </Text>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>

                  <FlatList
                    data={filteredRealUsers}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setActiveUser(item)}
                        className="flex-row items-center p-3.5 bg-white dark:bg-slate-900 rounded-2xl mb-3"
                      >
                        <View className="relative mr-3.5">
                          <Image source={{ uri: item.avatar }} style={{ width: 46, height: 46, borderRadius: 23 }} />
                          {onlineStatus[item.id] && (
                            <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-1.5 border-white dark:border-slate-900" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-[14.5px] font-bold text-slate-800 dark:text-slate-100">{item.name}</Text>
                          <Text numberOfLines={1} className="text-xs text-slate-400 mt-0.5">@{item.username}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    )}
                  />
                </View>
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
                  contentContainerStyle={{ paddingBottom: 120 }}
                  renderItem={({ item }) => (
                    <View className="flex-row items-center p-3.5 bg-white dark:bg-slate-900 rounded-2xl mb-3">
                      <View className="relative mr-3.5">
                        <Image source={{ uri: item.avatar }} style={{ width: 46, height: 46, borderRadius: 23 }} />
                        {onlineStatus[item.id] && (
                          <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-1.5 border-white dark:border-slate-900" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-[14.5px] font-bold text-slate-800 dark:text-slate-100">{item.name}</Text>
                        <Text className="text-xs text-slate-400 mt-0.5">@{item.username}</Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleSendRequest(item.id)}
                        className="bg-purple-100 dark:bg-purple-950 px-4 py-2 rounded-full"
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
                {/* Segmented Selector (Borderless & Shadowless) */}
                <View className="flex-row bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4">
                  <TouchableOpacity
                    onPress={() => setRequestsSubTab("incoming")}
                    className={`flex-1 py-2 rounded-lg items-center ${requestsSubTab === "incoming" ? "bg-white dark:bg-slate-900" : ""}`}
                  >
                    <Text className={`text-xs font-extrabold ${requestsSubTab === "incoming" ? "text-[#a133b2]" : "text-slate-500"}`}>
                      Incoming ({pendingRequests.length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setRequestsSubTab("sent")}
                    className={`flex-1 py-2 rounded-lg items-center ${requestsSubTab === "sent" ? "bg-white dark:bg-slate-900" : ""}`}
                  >
                    <Text className={`text-xs font-extrabold ${requestsSubTab === "sent" ? "text-[#a133b2]" : "text-slate-500"}`}>
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
                      contentContainerStyle={{ paddingBottom: 120 }}
                      renderItem={({ item }) => (
                        <View className="flex-row items-center p-3.5 bg-white dark:bg-slate-900 rounded-2xl mb-3">
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
                                className="bg-emerald-100 dark:bg-emerald-950 px-3.5 py-1.5 rounded-full"
                              >
                                <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleRequestResponse(item.id, "declined")}
                                className="bg-red-100 dark:bg-red-950 px-3.5 py-1.5 rounded-full"
                              >
                                <Text className="text-xs font-bold text-red-500 dark:text-red-400">Decline</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                          {item.status === "accepted" && (
                            <View className="bg-emerald-100 dark:bg-emerald-950 px-3.5 py-1.5 rounded-full">
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
                      contentContainerStyle={{ paddingBottom: 120 }}
                      renderItem={({ item }) => {
                        const isCancelled = item.status === "cancelled";
                        const isAccepted = item.status === "accepted";
                        return (
                          <View
                            className="flex-row items-center p-3.5 bg-white dark:bg-slate-900 rounded-2xl mb-3"
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
                                className="bg-red-100 dark:bg-red-950 px-3.5 py-1.5 rounded-full"
                              >
                                <Text className="text-xs font-bold text-red-500 dark:text-red-400">Cancel</Text>
                              </TouchableOpacity>
                            )}
                            {isCancelled && (
                              <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleResendRequest(item.id)}
                                className="bg-purple-100 dark:bg-purple-950 px-3.5 py-1.5 rounded-full flex-row items-center gap-1"
                              >
                                <Ionicons name="refresh" size={11} color="#a133b2" />
                                <Text className="text-xs font-extrabold text-[#a133b2] dark:text-purple-300">Re-send</Text>
                              </TouchableOpacity>
                            )}
                            {isAccepted && (
                              <View className="bg-emerald-100 dark:bg-emerald-950 px-3.5 py-1.5 rounded-full">
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
                  contentContainerStyle={{ paddingBottom: 120 }}
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
      </View>
    );
  }

  // ==================== 4. DEFAULT DEMO MODE MAIN DASHBOARD ====================
  return (
    <View style={{ flex: 1, backgroundColor: colorScheme === "dark" ? "#020617" : "#f8fafc", paddingTop: topPaddingOffset }} onLayout={handleLayout}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colorScheme === "dark" ? "#020617" : "#f8fafc"}
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
        {filteredUsers.filter(u => onlineStatus[u.id]).length > 0 && (
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
                ...filteredUsers.filter(u => onlineStatus[u.id])
              ]}
              keyExtractor={(item) => `active-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              renderItem={({ item }) => {
                if (item.isMe) {
                  return (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      className="items-center mr-5"
                    >
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
                    <Text className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 mt-2 text-center max-w-[60px]" numberOfLines={1}>
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
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveUser(item)}
              className="flex-row items-center p-3.5 bg-white dark:bg-slate-900 rounded-2xl mb-3"
            >
              <View className="relative mr-3.5">
                <Image
                  source={{ uri: item.avatar }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                />
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
                    {item.date}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between mt-1">
                  <Text
                    numberOfLines={1}
                    className="flex-1 text-[12.5px] text-slate-500 dark:text-slate-400 font-medium mr-2"
                  >
                    {item.lastMessage}
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
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>

      {/* Full-Screen Image Viewer Modal */}
      <Modal
        visible={activeFullscreenImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveFullscreenImage(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.95)", justifyContent: "center", alignItems: "center" }}>
          {activeFullscreenImage && (
            <>
              {/* Back / Close button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveFullscreenImage(null)}
                style={{
                  position: "absolute",
                  top: 50,
                  left: 20,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                }}
              >
                <Feather name="x" size={24} color="#ffffff" />
              </TouchableOpacity>

              {/* The Image itself */}
              <Image
                source={{ uri: activeFullscreenImage }}
                style={{
                  width: "90%",
                  height: "70%",
                }}
                contentFit="contain"
              />
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}