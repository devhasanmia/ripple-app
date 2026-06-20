import React from "react";
import { View, TextInput, Text } from "react-native";

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ placeholder, value, onChangeText }: SearchBarProps) {
  return (
    <View className="bg-slate-100 border border-slate-200/60 rounded-full px-4.5 py-3 mb-5 flex-row items-center shadow-sm">
      <Text className="text-slate-400 mr-2.5 text-sm">🔍</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChangeText}
        className="flex-1 text-[14px] text-slate-800"
      />
    </View>
  );
}
