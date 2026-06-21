import { ListSkeleton } from "@/components/loading-screen";
import "@/global.css";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Waveform } from "@/components/waveform";
import { API_URL, WS_URL } from "@/constants/config";
import { ChatMessage, ChatRequest, User } from "@/types";
import {
  getDateSeparatorText,
  getDayString,
  getMessageDate
} from "@/utils/date";

import { AuthScreen } from "@/components/auth-screen";
import { ChatRoom } from "@/components/chat-room";
import { DashboardView } from "@/components/dashboard-view";
import { WelcomeScreen } from "@/components/welcome-screen";

import {
  DANIEL_CONVERSATION,
  DAVID_USER,
  JAMES_CONVERSATION,
  MOCK_USERS
} from "@/constants/mock-data";

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

  // API loading states
  const [realChatsLoading, setRealChatsLoading] = useState(false);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    const onBackPress = () => {
      if (activeFullscreenImage !== null) {
        setActiveFullscreenImage(null);
        return true;
      }
      if (activeUser !== null) {
        setActiveUser(null);
        setShowEmojiTray(false);
        return true;
      }
      if (currentMode === "auth") {
        setAuthError("");
        setCurrentMode(null);
        return true;
      }
      if (currentMode === "demo") {
        setCurrentMode(null);
        return true;
      }
      if (currentMode === "real") {
        if (realActiveTab !== "chats") {
          setRealActiveTab("chats");
          return true;
        }
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => subscription.remove();
  }, [activeFullscreenImage, activeUser, currentMode, realActiveTab]);

  // Unread message counts mapping: { [userId]: number }
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(() => {
    const initialCounts: Record<string, number> = {};
    MOCK_USERS.forEach(user => {
      initialCounts[user.id] = user.unreadCount || 0;
    });
    return initialCounts;
  });

  // Tracks last message epoch (ms) per userId — used to sort conversations by recency
  const [lastActivityAt, setLastActivityAt] = useState<Record<string, number>>({});
  const activeUserRef = useRef<User | null>(null);

  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  // Profile Edit Form State
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPin, setEditPin] = useState("");
  const [editAvatarUri, setEditAvatarUri] = useState("");
  const [editAvatarBase64, setEditAvatarBase64] = useState("");
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });
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
        mediaTypes: ["images"],
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
    let isActive = true; // becomes false on cleanup — stops stale reconnects
    // Deduplicates WS events so double-fire (React StrictMode) never double-increments
    const processedMsgIds = new Set<string>();

    const connectWS = () => {
      if (!isActive) return;
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

            // Skip if we already processed this message id (guards against double WS connections)
            if (processedMsgIds.has(message.id)) return;
            processedMsgIds.add(message.id);

            const currentLogged = loggedInUserRef.current;
            const isReal = currentModeRef.current === "real" && currentLogged;
            const threadId = message.senderId === (isReal ? currentLogged.id : "me") ? message.partnerId : message.senderId;

            // Increment unread count only for messages from the OTHER person while chat is closed
            const currentActiveUser = activeUserRef.current;
            if (!currentActiveUser || currentActiveUser.id !== threadId) {
              const myId = isReal ? currentLogged.id : "me";
              if (message.senderId !== myId) {
                setUnreadCounts((prev) => ({
                  ...prev,
                  [threadId]: (prev[threadId] || 0) + 1,
                }));
              }
            }

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

            // Update last-activity timestamp so the chat list re-sorts in real-time
            setLastActivityAt((prev) => ({ ...prev, [threadId]: Date.now() }));
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
        // Only reconnect if this effect instance is still active
        if (isActive) {
          reconnectTimeout = setTimeout(() => {
            connectWS();
          }, 3000);
        }
      };

      socket.onerror = (error) => {
        console.warn("WebSocket error:", error);
      };
    };

    connectWS();

    return () => {
      isActive = false; // prevent any pending reconnect from firing
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (socket) {
        socket.onclose = null; // suppress reconnect on intentional close
        socket.close();
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
    setRealChatsLoading(true);
    fetch(`${API_URL}/api/users/chats/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRealChats(data);
          const initialCounts: Record<string, number> = {};
          data.forEach(user => {
            initialCounts[user.id] = user.unreadCount || 0;
          });
          setUnreadCounts(prev => ({ ...prev, ...initialCounts }));
        }
      })
      .catch((err) => console.error("Error fetching chats:", err))
      .finally(() => setRealChatsLoading(false));
  };

  const fetchExploreUsers = (userId: string) => {
    setExploreLoading(true);
    fetch(`${API_URL}/api/users/explore/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setExploreUsers(data);
      })
      .catch((err) => console.error("Error fetching explore users:", err))
      .finally(() => setExploreLoading(false));
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
        setRequestsLoading(true);
        Promise.all([
          fetch(`${API_URL}/api/requests/pending/${loggedInUser.id}`).then((res) => res.json()),
          fetch(`${API_URL}/api/requests/sent/${loggedInUser.id}`).then((res) => res.json())
        ])
          .then(([pending, sent]) => {
            if (Array.isArray(pending)) setPendingRequests(pending);
            if (Array.isArray(sent)) setSentRequests(sent);
          })
          .catch((err) => console.error("Error fetching requests:", err))
          .finally(() => setRequestsLoading(false));
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

  const handleAuthSubmit = (optUsername?: string, optPin?: string) => {
    setAuthError("");
    const usernameVal = optUsername || formUsername;
    const pinVal = optPin || formPin;

    if (!usernameVal || !pinVal) {
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
          username: usernameVal,
          pin: pinVal
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
          username: usernameVal,
          pin: pinVal
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
      setUnreadCounts((prev) => ({
        ...prev,
        [activeUser.id]: 0,
      }));
      setMessagesLoading(true);
      const currentId = currentMode === "real" && loggedInUser ? loggedInUser.id : "me";
      fetch(`${API_URL}/api/messages/${activeUser.id}?currentUserId=${currentId}`)
        .then((res) => res.json())
        .then((data) => {
          setConversations((prev) => ({
            ...prev,
            [activeUser.id]: data,
          }));
        })
        .catch((err) => console.error("Error fetching messages:", err))
        .finally(() => setMessagesLoading(false));

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

    if (currentMode !== "real") {
      setTypingStatus((prev) => ({
        ...prev,
        [senderId]: isTyping,
      }));
    }

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

    // Bubble this chat to the top of the home list immediately
    setLastActivityAt((prev) => ({ ...prev, [activeUser.id]: Date.now() }));

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

    // Bubble this chat to the top of the home list immediately
    setLastActivityAt((prev) => ({ ...prev, [activeUser.id]: Date.now() }));

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

    // Find this message's true index in the full activeMessages array for correct date/avatar logic
    const trueIndex = activeMessages.findIndex((m) => m.id === item.id);

    // Show avatar if received, and it's the last message of a consecutive block from the sender
    const isLastInBlock = trueIndex === activeMessages.length - 1 || activeMessages[trueIndex + 1]?.senderId !== item.senderId;
    const showAvatar = !isSent && (item.showAvatar !== false && isLastInBlock);

    const itemDate = getMessageDate(item);
    const prevItem = trueIndex > 0 ? activeMessages[trueIndex - 1] : null;
    // Show date divider only when the day changes — so "TODAY" appears at most once per day
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

  if (loading) {
    return <ListSkeleton />;
  }

  const topPaddingOffset = Platform.OS === "web" ? 64 : 0;

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
          messagesLoading={messagesLoading}
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

  // ==================== 3 & 4. REAL/DEMO DASHBOARD VIEWS ====================
  return (
    <DashboardView
      currentMode={currentMode}
      setCurrentMode={setCurrentMode}
      realActiveTab={realActiveTab}
      setRealActiveTab={setRealActiveTab}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      activeUser={activeUser}
      setActiveUser={setActiveUser}
      loggedInUser={loggedInUser}
      davidUser={davidUser}
      mockUsers={mockUsers}
      realChats={realChats}
      exploreUsers={exploreUsers}
      onlineStatus={onlineStatus}
      pendingRequests={pendingRequests}
      sentRequests={sentRequests}
      requestsSubTab={requestsSubTab}
      setRequestsSubTab={setRequestsSubTab}
      handleSendRequest={handleSendRequest}
      handleRequestResponse={handleRequestResponse}
      handleCancelRequest={handleCancelRequest}
      handleResendRequest={handleResendRequest}
      handleLogout={handleLogout}
      colorScheme={colorScheme === "unspecified" ? null : colorScheme}
      topPaddingOffset={topPaddingOffset}
      handleLayout={handleLayout}
      androidKeyboardPadding={androidKeyboardPadding}
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
      realChatsLoading={realChatsLoading}
      exploreLoading={exploreLoading}
      requestsLoading={requestsLoading}
      conversations={conversations}
      unreadCounts={unreadCounts}
      lastActivityAt={lastActivityAt}
    />
  );
}