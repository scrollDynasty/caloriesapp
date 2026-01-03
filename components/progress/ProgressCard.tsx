import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface ProgressCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  subtitle?: string;
  iconColor?: string;
  gradientColors?: [string, string];
}

export function ProgressCard({ icon, value, label, subtitle, iconColor, gradientColors }: ProgressCardProps) {
  const { colors } = useTheme();
  const defaultGradient: [string, string] = [colors.primary + '15', colors.primary + '05'];
  const iconBgColor = iconColor ? iconColor + '20' : colors.primary + '20';

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
      <LinearGradient
        colors={gradientColors || defaultGradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Ionicons name={icon} size={22} color={iconColor || colors.primary} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 130,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  gradientBackground: {
    flex: 1,
    padding: 14,
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    marginTop: 10,
  },
  value: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 3,
    letterSpacing: -0.4,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "left",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "left",
  },
});
