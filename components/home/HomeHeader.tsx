import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface HomeHeaderProps {
  streak?: number;
}

export const HomeHeader = memo(function HomeHeader({ streak = 0 }: HomeHeaderProps) {
  const { colors: themeColors, isDark } = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.headerTitle}>
        <View style={[styles.logoContainer, { backgroundColor: isDark ? themeColors.gray5 : "#EFECE5" }]}>
          <Ionicons name="logo-apple" size={18} color={themeColors.text} />
        </View>
        <Text style={[styles.appName, { color: themeColors.text }]}>Yeb Ich</Text>
      </View>
      <View style={[styles.streakBadge, { backgroundColor: themeColors.card }]}>
        <Ionicons name="flame" size={18} color="#FF9F43" />
        <Text style={[styles.streakText, { color: themeColors.text }]}>{streak}</Text>
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
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    letterSpacing: -0.2,
  },
});
