import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  runOnJS,
  Easing,
  interpolate,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { markSplashSeen } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [showSkip, setShowSkip] = useState(false);
  const [finished, setFinished] = useState(false);

  const helmetProgress = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const sparkScale = useSharedValue(0);
  const fadeOut = useSharedValue(1);
  const skipOpacity = useSharedValue(0);

  const spark1X = useSharedValue(0);
  const spark1Y = useSharedValue(0);
  const spark2X = useSharedValue(0);
  const spark2Y = useSharedValue(0);
  const spark3X = useSharedValue(0);
  const spark3Y = useSharedValue(0);
  const sparkOpacity = useSharedValue(0);

  const navigateToLogin = async () => {
    if (finished) return;
    setFinished(true);
    await markSplashSeen();
    try {
      router.replace("/login" as any);
    } catch {}
  };

  useEffect(() => {
    helmetProgress.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    textOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    taglineOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));

    sparkScale.value = withDelay(1400, withSpring(1, { damping: 8, stiffness: 120 }));
    sparkOpacity.value = withDelay(1400, withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(400, withTiming(0, { duration: 400 }))
    ));
    spark1X.value = withDelay(1400, withSpring(-30, { damping: 10 }));
    spark1Y.value = withDelay(1400, withSpring(-25, { damping: 10 }));
    spark2X.value = withDelay(1500, withSpring(35, { damping: 10 }));
    spark2Y.value = withDelay(1500, withSpring(-20, { damping: 10 }));
    spark3X.value = withDelay(1600, withSpring(15, { damping: 10 }));
    spark3Y.value = withDelay(1600, withSpring(-35, { damping: 10 }));

    const skipTimer = setTimeout(() => {
      setShowSkip(true);
      skipOpacity.value = withTiming(1, { duration: 300 });
    }, 1000);

    const autoNav = setTimeout(() => {
      fadeOut.value = withTiming(0, { duration: 400 }, (done) => {
        if (done) runOnJS(navigateToLogin)();
      });
    }, 3000);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(autoNav);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSkip = () => {
    fadeOut.value = withTiming(0, { duration: 300 }, (done) => {
      if (done) runOnJS(navigateToLogin)();
    });
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  const helmetStyle = useAnimatedStyle(() => ({
    opacity: helmetProgress.value,
    transform: [
      { scale: interpolate(helmetProgress.value, [0, 0.5, 1], [0.3, 1.1, 1]) },
      { translateY: interpolate(helmetProgress.value, [0, 1], [20, 0]) },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: interpolate(textOpacity.value, [0, 1], [10, 0]) }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const skipStyle = useAnimatedStyle(() => ({
    opacity: skipOpacity.value,
  }));

  const spark1Style = useAnimatedStyle(() => ({
    opacity: sparkOpacity.value,
    transform: [{ translateX: spark1X.value }, { translateY: spark1Y.value }, { scale: sparkScale.value }],
  }));
  const spark2Style = useAnimatedStyle(() => ({
    opacity: sparkOpacity.value,
    transform: [{ translateX: spark2X.value }, { translateY: spark2Y.value }, { scale: sparkScale.value }],
  }));
  const spark3Style = useAnimatedStyle(() => ({
    opacity: sparkOpacity.value,
    transform: [{ translateX: spark3X.value }, { translateY: spark3Y.value }, { scale: sparkScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {showSkip && (
        <Animated.View style={[styles.skipWrap, { top: topPad + 12 }, skipStyle]}>
          <Pressable onPress={handleSkip} style={styles.skipBtn} testID="splash-skip">
            <Text style={styles.skipText}>Überspringen</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.raw.zinc400} />
          </Pressable>
        </Animated.View>
      )}

      <View style={styles.center}>
        <View style={styles.logoArea}>
          <Animated.View style={[styles.helmetWrap, helmetStyle]}>
            <Image source={require("@/assets/images/logo.png")} style={{ width: 72, height: 72 }} resizeMode="contain" />
          </Animated.View>

          <View style={styles.sparkContainer}>
            <Animated.View style={[styles.spark, spark1Style]} />
            <Animated.View style={[styles.spark, styles.sparkMd, spark2Style]} />
            <Animated.View style={[styles.spark, styles.sparkSm, spark3Style]} />
          </View>
        </View>

        <Animated.Text style={[styles.logoText, textStyle]}>BAUGENIUS</Animated.Text>
        <Animated.Text style={[styles.tagline, taglineStyle]}>Von Sklave zu Chef.</Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  skipWrap: {
    position: "absolute",
    right: 20,
    zIndex: 10,
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoArea: {
    position: "relative",
    marginBottom: 20,
  },
  helmetWrap: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  sparkContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 0,
    height: 0,
  },
  spark: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.raw.amber500,
  },
  sparkMd: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.raw.amber400,
  },
  sparkSm: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.raw.amber600,
  },
  logoText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 36,
    color: Colors.raw.amber500,
    letterSpacing: 3,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.zinc400,
    marginTop: 8,
  },
});
