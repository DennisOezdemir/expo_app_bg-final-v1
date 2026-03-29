import { StyleSheet, View, Pressable, Platform, Text } from "react-native";
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
  projectId: string;
}

export function FAB({ projectId }: FABProps) {
  const pulse = useSharedValue(1);
  const fabScale = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.08], [0.2, 0]),
  }));

  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  return (
    <AnimatedPressable
      style={[fabStyles.container, fabAnimStyle]}
      onPressIn={() => {
        fabScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        fabScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={() => {
        if (Platform.OS !== "web")
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/chat/${projectId}`);
      }}
      testID="fab-assistant"
    >
      <Animated.View style={[fabStyles.pulse, pulseStyle]} />
      <View style={fabStyles.inner}>
        <Ionicons name="sparkles" size={22} color="#000" />
        <Text style={fabStyles.label}>BG Agent</Text>
      </View>
    </AnimatedPressable>
  );
}

const fabStyles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 24,
  },
  pulse: {
    position: "absolute",
    width: "100%",
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.raw.amber500,
  },
  inner: {
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.raw.amber500,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    shadowColor: Colors.raw.amber500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 8,
  },
  label: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#fff",
  },
});
