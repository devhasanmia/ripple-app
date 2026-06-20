import { User, ChatMessage } from "@/types";

export const MOCK_USERS: User[] = [
  {
    id: "daniel-mercer",
    name: "Daniel Mercer",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
    ringColor: "#a133b2",
    lastSeen: "Active Now",
    unreadCount: 0,
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
  }
];

export const DAVID_USER: User = {
  id: "me",
  name: "David",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  ringColor: "#a133b2",
  lastSeen: "Active Now",
  unreadCount: 0,
  lastMessage: "",
  date: "",
};

export const DANIEL_CONVERSATION: ChatMessage[] = [
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

export const SARAH_CONVERSATION: ChatMessage[] = [
  { id: "s1", senderId: "sarah-connor", type: "text", text: "Hey David! Are we still meeting?", timestamp: "3:40 PM", showAvatar: true },
  { id: "s2", senderId: "me", type: "text", text: "Hey Sarah, yes, 4 PM works for me.", timestamp: "3:42 PM" },
  { id: "s3", senderId: "sarah-connor", type: "text", text: "Great! Let's catch up tomorrow.", timestamp: "3:45 PM", showAvatar: true }
];

export const JAMES_CONVERSATION: ChatMessage[] = [
  { id: "j1", senderId: "james-smith", type: "text", text: "Hey, can you send that file?", timestamp: "1:15 PM", showAvatar: true },
  { id: "j2", senderId: "me", type: "text", text: "Sure, let me upload it.", timestamp: "1:20 PM" }
];
