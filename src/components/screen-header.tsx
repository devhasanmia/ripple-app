import React from "react";
import { View, Text } from "react-native";

interface ScreenHeaderProps {
  title: string;
  subtitle: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View className="mb-5">
      <Text className="text-[25px] font-black text-slate-900 tracking-tight">
        {title}
      </Text>
      <Text className="text-xs text-slate-400 mt-0.5">
        {subtitle}
      </Text>
    </View>
  );
}
