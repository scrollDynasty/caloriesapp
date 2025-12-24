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

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
      <LinearGradient
        colors={gradientColors || defaultGradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconColor || colors.primary + '20' }]}>
          <Ionicons name={icon} size={28} color={iconColor || colors.primary} />
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
    borderRadius: 24,
    overflow: "hidden",
    minHeight: 160,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  gradientBackground: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    marginTop: 12,
  },
  value: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "left",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "left",
  },
});
