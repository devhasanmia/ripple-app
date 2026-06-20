import { ChatMessage } from "@/types";

export const getHeaderDateString = (): string => {
  const date = new Date();
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const day = date.getDate();
  const year = date.getFullYear();
  return `${weekday} ${day}, ${year}`;
};

export const timeAgo = (dateStr: string | Date | undefined): string => {
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

export const getMessageDate = (item: ChatMessage): Date => {
  if (!item.id || item.id.length !== 24) {
    return new Date();
  }
  const sec = parseInt(item.id.substring(0, 8), 16);
  if (isNaN(sec)) {
    return new Date();
  }
  return new Date(sec * 1000);
};

export const getDayString = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getDateSeparatorText = (date: Date): string => {
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
