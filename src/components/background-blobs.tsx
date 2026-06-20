import React from "react";
import { View } from "react-native";

export function BackgroundBlobs() {
  return (
    <View className="absolute top-0 left-0 right-0 bottom-0 z-0 overflow-hidden" pointerEvents="none">
      <View className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/5 opacity-60 filter blur-3xl" />
      <View className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-500/5 opacity-40 filter blur-3xl" />
    </View>
  );
}
