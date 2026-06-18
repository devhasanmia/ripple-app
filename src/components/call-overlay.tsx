import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CallOverlayProps {
  visible: boolean;
  onClose: () => void;
  name: string;
  avatar: string;
  type: "voice" | "video";
}

function PulsingRing({ delay }: { delay: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    const startAnimation = () => {
      scale.value = 1;
      opacity.value = 0.6;

      scale.value = withRepeat(
        withTiming(2.2, {
          duration: 2500,
          easing: Easing.out(Easing.quad),
        }),
        -1,
        false
      );

      opacity.value = withRepeat(
        withTiming(0, {
          duration: 2500,
          easing: Easing.out(Easing.quad),
        }),
        -1,
        false
      );
    };

    const timer = setTimeout(startAnimation, delay);
    return () => clearTimeout(timer);
  }, [delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 140,
          height: 140,
          borderRadius: 70,
          borderWidth: 2,
          borderColor: "rgba(161, 51, 178, 0.4)",
          backgroundColor: "rgba(161, 51, 178, 0.05)",
        },
        animatedStyle,
      ]}
    />
  );
}

function WaveBar({ delay }: { delay: number }) {
  const height = useSharedValue(8);

  useEffect(() => {
    height.value = withRepeat(
      withTiming(25 + Math.random() * 20, {
        duration: 400 + Math.random() * 300,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [height]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: 3,
          backgroundColor: "#a133b2",
          borderRadius: 2,
          marginHorizontal: 1.5,
        },
        animatedStyle,
      ]}
    />
  );
}

export function CallOverlay({ visible, onClose, name, avatar, type }: CallOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [timerCount, setTimerCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  // Translation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setTimerCount(0);
      translateY.value = withSpring(0, { damping: 18, stiffness: 90 });
      overlayOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, { damping: 18, stiffness: 90 }, (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
        }
      });
      overlayOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, translateY, overlayOpacity]);

  // Call timer effect
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setTimerCount((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    onClose();
  };

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!mounted) return null;

  return (
    <View style={styles.absoluteContainer}>
      <StatusBar barStyle="light-content" />
      {/* Background Backdrop Fader */}
      <Animated.View style={[styles.backdrop, backdropStyle]} />

      {/* Main Sliding Content Container */}
      <Animated.View style={[styles.contentContainer, contentStyle]}>

        {/* VIDEO CALL SIMULATION BACKGROUND */}
        {type === "video" ? (
          <View style={styles.videoBackgroundContainer}>
            {/* Main Caller Camera Feed (Callee) */}
            <Image
              source={{ uri: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" }}
              style={styles.fullScreenVideoFeed}
              blurRadius={Platform.OS === "web" ? 0 : 1}
            />
            {/* Gradient Overlay for legibility */}
            <View style={styles.videoGradientOverlay} />

            {/* Picture in Picture (Self Feed) */}
            <View style={styles.pipContainer}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" }}
                style={styles.pipImage}
              />
              <View style={styles.pipFrame} />
            </View>
          </View>
        ) : (
          /* VOICE CALL GRADIENT BACKDROP */
          <View style={styles.voiceBackgroundContainer}>
            <View style={styles.glowBlob1} />
            <View style={styles.glowBlob2} />
          </View>
        )}

        {/* TOP META - CALL STATE & TIMER */}
        <View style={styles.topMeta}>
          <Text style={styles.callTypeLabel}>
            {type === "video" ? "RIPPLE HD VIDEO CALL" : "RIPPLE VOICE CALL"}
          </Text>
          <Text style={styles.timerText}>{formatTime(timerCount)}</Text>

          {/* Animated sound waves indicating active call */}
          <View style={styles.soundWaveRow}>
            <WaveBar delay={0} />
            <WaveBar delay={150} />
            <WaveBar delay={300} />
            <WaveBar delay={450} />
            <WaveBar delay={600} />
          </View>
        </View>

        {/* CENTER CALLEE PROFILE */}
        <View style={styles.profileSection}>
          {type === "voice" && (
            <View style={styles.radarContainer}>
              <PulsingRing delay={0} />
              <PulsingRing delay={800} />
              <PulsingRing delay={1600} />

              <Image source={{ uri: avatar }} style={styles.voiceAvatar} />
            </View>
          )}

          <Text style={styles.calleeName}>{name}</Text>
          <Text style={styles.statusLabel}>
            {type === "video" ? "Camera is active" : "Connected via secure line"}
          </Text>
        </View>

        {/* BOTTOM CONTROLS PANEL */}
        <View style={styles.bottomControls}>
          <View style={styles.buttonsRow}>
            {/* Speaker Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsSpeaker(!isSpeaker)}
              style={[
                styles.controlButton,
                isSpeaker && styles.controlButtonActive,
              ]}
            >
              <Text style={[styles.buttonIcon, isSpeaker && styles.buttonIconActive]}>
                🔊
              </Text>
              <Text style={styles.buttonLabel}>Speaker</Text>
            </TouchableOpacity>

            {/* Mute Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsMuted(!isMuted)}
              style={[
                styles.controlButton,
                isMuted && styles.controlButtonActive,
              ]}
            >
              <Text style={[styles.buttonIcon, isMuted && styles.buttonIconActive]}>
                🎙️
              </Text>
              <Text style={styles.buttonLabel}>{isMuted ? "Unmute" : "Mute"}</Text>
            </TouchableOpacity>
          </View>

          {/* End Call Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleEndCall}
            style={styles.endCallButton}
          >
            <Text style={styles.endCallIcon}>📞</Text>
          </TouchableOpacity>
          <Text style={styles.endCallLabel}>End Call</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
  },
  contentContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing(10),
    position: "relative",
    overflow: "hidden",
  },
  voiceBackgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0b0410",
    zIndex: -1,
  },
  glowBlob1: {
    position: "absolute",
    top: -100,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "#6366f1",
    opacity: 0.15,
    ...Platform.select({
      web: { filter: "blur(80px)" },
    }),
  },
  glowBlob2: {
    position: "absolute",
    bottom: -100,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "#a133b2",
    opacity: 0.15,
    ...Platform.select({
      web: { filter: "blur(80px)" },
    }),
  },
  videoBackgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    backgroundColor: "#000",
  },
  fullScreenVideoFeed: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  videoGradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  pipContainer: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 100,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "#1e293b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  pipImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  pipFrame: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
  },
  topMeta: {
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 40 : 25,
    zIndex: 10,
  },
  callTypeLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  timerText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "200",
    letterSpacing: 1.5,
    fontVariant: ["tabular-nums"],
  },
  soundWaveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    marginTop: 10,
  },
  profileSection: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  radarContainer: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 24,
  },
  voiceAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#ffffff",
    position: "absolute",
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  calleeName: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  statusLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
  },
  bottomControls: {
    width: "100%",
    alignItems: "center",
    marginBottom: Platform.OS === "ios" ? 30 : 20,
    zIndex: 10,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 30,
    marginBottom: 35,
    width: "100%",
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonActive: {
    backgroundColor: "#ffffff",
  },
  buttonIcon: {
    fontSize: 18,
    color: "#ffffff",
  },
  buttonIconActive: {
    color: "#111827",
  },
  buttonLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 28,
    position: "absolute",
    width: 80,
    textAlign: "center",
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "135deg" }],
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  endCallIcon: {
    color: "#ffffff",
    fontSize: 24,
  },
  endCallLabel: {
    color: "#ef4444",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 10,
    letterSpacing: 0.5,
  },
});

// Helper function to size paddings dynamically
function Spacing(multiplier: number) {
  return multiplier * 8;
}
