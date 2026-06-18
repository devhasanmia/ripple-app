import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, View } from "react-native";

interface LoadingProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading Settings..." }: LoadingProps) {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
      <View className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 items-center gap-4 w-48">
        <ActivityIndicator size="large" color="#6366f1" />
        <Animated.Text
          style={{ opacity: fadeAnim }}
          className="text-sm font-semibold text-slate-500 dark:text-slate-400"
        >
          {message}
        </Animated.Text>
      </View>
    </View>
  );
}

export function ListSkeleton() {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950 px-4 py-4">
      {/* Search Bar Skeleton */}
      <Animated.View
        style={{ opacity: fadeAnim }}
        className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full mb-6 shadow-sm"
      />

      {/* List Items Skeletons */}
      {Array.from({ length: 6 }).map((_, index) => (
        <Animated.View
          key={index}
          style={{ opacity: fadeAnim }}
          className="flex-row items-center gap-4 mb-4 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
        >
          {/* Avatar Skeleton */}
          <View className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800" />

          {/* Text Skeletons */}
          <View className="flex-1 gap-2.5">
            <View className="w-28 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <View className="w-44 h-3 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
