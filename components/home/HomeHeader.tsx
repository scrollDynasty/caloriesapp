import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";

interface HomeHeaderProps {
  streak?: number;
}

export const HomeHeader = memo(function HomeHeader({ streak = 0 }: HomeHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTitle}>
        <View style={styles.logoContainer}>
          <Ionicons name="logo-apple" size={18} color={colors.primary} />
        </View>
        <Text style={styles.appName}>Yeb Ich</Text>
      </View>
      <View style={styles.streakBadge}>
        <Ionicons name="flame" size={18} color="#FF9F43" />
        <Text style={styles.streakText}>{streak}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 12,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFECE5",
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  streakText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
    letterSpacing: -0.2,
  },
});
