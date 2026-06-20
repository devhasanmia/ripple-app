export interface User {
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

export interface ChatMessage {
  id: string;
  senderId: string;
  type: "text" | "voice" | "image";
  text?: string;
  imageUri?: string;
  waveformType?: 1 | 2 | 3;
  timestamp: string;
  showAvatar?: boolean;
}

export interface ChatRequest {
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
