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
        <Ionicons name="nutrition" size={28} color={colors.primary} />
        <Text style={styles.appName}>Yeb-ich</Text>
      </View>
      <View style={styles.streakBadge}>
        <Ionicons name="flame" size={16} color="#FF6B35" />
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
    fontFamily: "Inter_700Bold",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B35",
    fontFamily: "Inter_600SemiBold",
  },
});
