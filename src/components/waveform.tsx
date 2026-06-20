import React from "react";
import { View } from "react-native";

const waveHeights1 = [8, 12, 16, 10, 8, 14, 20, 16, 12, 18, 22, 14, 8, 12, 16, 10, 8, 14, 18, 12];
const waveHeights2 = [10, 14, 18, 24, 28, 20, 16, 12, 8, 10, 16, 22, 18, 12, 14, 20, 24, 16, 10, 8, 12, 16, 22, 26, 18, 14, 12, 10, 16, 14, 8, 6];
const waveHeights3 = [12, 16, 20, 24, 18, 14, 10, 12, 16, 22, 26, 20, 14, 12, 16, 20, 24, 18, 14, 10, 12, 16, 20, 24, 18, 14, 10, 8];

interface WaveformProps {
  type: 1 | 2 | 3;
  color: string;
}

export function Waveform({ type, color }: WaveformProps) {
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
