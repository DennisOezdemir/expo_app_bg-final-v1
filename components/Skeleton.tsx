import { useEffect, useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Colors from "@/constants/colors";

function usePulseAnimation() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const opacity = useSharedValue(1);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!reduceMotion) {
      opacity.value = withRepeat(
        withTiming(0.4, { duration: 600 }),
        -1,
        true,
      );
    } else {
      opacity.value = 1;
    }
  }, [reduceMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return animatedStyle;
}

interface SkeletonBoxProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
}

export function SkeletonBox({ width = "100%", height, borderRadius = 8 }: SkeletonBoxProps) {
  const animatedStyle = usePulseAnimation();
  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: Colors.raw.zinc800,
        },
        animatedStyle,
      ]}
    />
  );
}

interface SkeletonLineProps {
  width?: number | string;
}

export function SkeletonLine({ width = "100%" }: SkeletonLineProps) {
  const animatedStyle = usePulseAnimation();
  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height: 14,
          borderRadius: 7,
          backgroundColor: Colors.raw.zinc800,
        },
        animatedStyle,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <SkeletonBox height={88} borderRadius={12} />
      <SkeletonBox height={88} borderRadius={12} />
      <SkeletonBox height={88} borderRadius={12} />
    </View>
  );
}
