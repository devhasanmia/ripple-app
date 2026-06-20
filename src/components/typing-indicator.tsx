import React, { useEffect, useRef } from "react";
import { Animated, Platform, View } from "react-native";

export function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -5,
            duration: 350,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 350,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.delay(350),
        ])
      );
    };

    const animation = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]);

    animation.start();
    return () => animation.stop();
  }, [dot1, dot2, dot3]);

  return (
    <View className="flex-row items-center gap-1 px-3 py-2 rounded-2xl bg-[#f0f0f3] dark:bg-slate-800 self-start ml-11 mb-4">
      <Animated.View
        style={{ transform: [{ translateY: dot1 }], width: 6, height: 6, borderRadius: 3, backgroundColor: "#94a3b8" }}
      />
      <Animated.View
        style={{ transform: [{ translateY: dot2 }], width: 6, height: 6, borderRadius: 3, backgroundColor: "#94a3b8" }}
      />
      <Animated.View
        style={{ transform: [{ translateY: dot3 }], width: 6, height: 6, borderRadius: 3, backgroundColor: "#94a3b8" }}
      />
    </View>
  );
}
