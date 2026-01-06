import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { hapticMedium } from "../../utils/haptics";

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap | null;
  iconSize?: number;
}

export function PrimaryButton({
  label,
  onPress,
  icon = "arrow-forward",
  iconSize,
}: PrimaryButtonProps) {
  const { colors, isDark } = useTheme();
  const defaultIconSize = Platform.OS === "android" ? 18 : 20;
  const finalIconSize = iconSize || defaultIconSize;
  
  return (
    <TouchableOpacity
      style={[styles.primaryButton, { backgroundColor: colors.buttonPrimary }]}
      onPress={() => {
        hapticMedium();
        onPress?.();
      }}
      activeOpacity={0.8}
    >
      <Text style={[styles.primaryButtonText, { color: colors.buttonPrimaryText }]}>{label}</Text>
      {icon && (
        <Ionicons
          name={icon}
          size={finalIconSize}
          color={colors.buttonPrimaryText}
          style={styles.primaryButtonIcon}
        />
      )}
    </TouchableOpacity>
  );
}

interface SecondaryButtonProps {
  label: string;
  onPress?: () => void;
}

export function SecondaryButton({ label, onPress }: SecondaryButtonProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.secondaryButtonContainer}>
      <TouchableOpacity
        style={[styles.secondaryButton, { backgroundColor: colors.buttonSecondary }]}
        onPress={() => {
          hapticMedium();
          onPress?.();
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.buttonSecondaryText }]}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    width: "100%",
    borderRadius: Platform.OS === "android" ? 14 : 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Platform.OS === "android" ? 6 : 8,
    paddingVertical: Platform.OS === "android" ? 14 : 16,
    paddingHorizontal: Platform.OS === "android" ? 20 : 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: Platform.OS === "android" ? 2 : 4,
    },
    shadowOpacity: Platform.OS === "android" ? 0.08 : 0.12,
    shadowRadius: Platform.OS === "android" ? 6 : 8,
    elevation: Platform.OS === "android" ? 2 : 4,
  },
  primaryButtonText: {
    fontSize: Platform.OS === "android" ? 15 : 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  primaryButtonIcon: {
    marginLeft: Platform.OS === "android" ? 2 : 4,
  },
  secondaryButtonContainer: {
    alignItems: "center",
  },
  secondaryButton: {
    paddingHorizontal: Platform.OS === "android" ? 16 : 20,
    paddingVertical: Platform.OS === "android" ? 10 : 12,
    borderRadius: Platform.OS === "android" ? 10 : 12,
  },
  secondaryButtonText: {
    fontSize: Platform.OS === "android" ? 14 : 15,
    fontWeight: "500",
    textAlign: "center",
    fontFamily: "Inter_500Medium",
  },
});
