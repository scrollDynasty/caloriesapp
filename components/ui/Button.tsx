import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

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
  iconSize = 20,
}: PrimaryButtonProps) {
  const { colors, isDark } = useTheme();
  
  return (
    <TouchableOpacity
      style={[styles.primaryButton, { backgroundColor: colors.buttonPrimary }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.primaryButtonText, { color: colors.buttonPrimaryText }]}>{label}</Text>
      {icon && (
        <Ionicons
          name={icon}
          size={iconSize}
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
        onPress={onPress}
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
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  primaryButtonIcon: {
    marginLeft: 4,
  },
  secondaryButtonContainer: {
    alignItems: "center",
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    fontFamily: "Inter_500Medium",
  },
});
