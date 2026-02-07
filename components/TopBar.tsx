import { StyleSheet, Text, View, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface TopBarProps {
  hasNotification?: boolean;
}

export function TopBar({ hasNotification = true }: TopBarProps) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topInset + 8 }]}>
      <Text style={styles.logo}>BAUGENIUS</Text>
      <Pressable
        style={({ pressed }) => [
          styles.bellButton,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        testID="notification-bell"
      >
        <Ionicons name="notifications-outline" size={24} color={Colors.raw.zinc400} />
        {hasNotification && <View style={styles.notificationDot} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  logo: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 22,
    color: Colors.raw.amber500,
    letterSpacing: -0.5,
  },
  bellButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.raw.rose500,
    borderWidth: 2,
    borderColor: Colors.raw.zinc950,
  },
});
