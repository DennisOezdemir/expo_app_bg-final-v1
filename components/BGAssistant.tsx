import { StyleSheet, View, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  Easing,
  interpolate,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FABProps {
  onPress?: () => void;
  projectId?: string;
}

export function FAB({ onPress, projectId }: FABProps) {
  const pulse = useSharedValue(1);
  const fabScale = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.15], [0.3, 0]),
  }));

  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  return (
    <AnimatedPressable
      style={[fabStyles.container, fabAnimStyle]}
      onPressIn={() => {
        fabScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        fabScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={() => {
        if (Platform.OS !== "web")
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/chat/${projectId || "general"}`);
      }}
      testID="fab-assistant"
    >
      <Animated.View style={[fabStyles.pulse, pulseStyle]} />
      <View style={fabStyles.inner}>
        <Ionicons name="mic" size={26} color="#000" />
      </View>
    </AnimatedPressable>
  );
}

const fabStyles = StyleSheet.create({
  container: {
    width: 56,
    height: 56,
  },
  pulse: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.raw.amber500,
  },
  inner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.raw.amber500,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.raw.amber500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});

/** @deprecated Mock overlay removed — FAB now navigates to /chat/[id] directly */
export function AssistantOverlay(_props: {
  visible: boolean;
  onClose: () => void;
}) {
  return null;
}
