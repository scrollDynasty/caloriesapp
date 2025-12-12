import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constants/theme";

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
  return (
    <TouchableOpacity
      style={styles.primaryButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
      {icon && (
        <Ionicons
          name={icon}
          size={iconSize}
          color={colors.background}
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
  return (
    <View style={styles.secondaryButtonContainer}>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.secondaryButtonText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    width: "100%",
    backgroundColor: colors.primary,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8, 
    paddingVertical: 16,
    paddingHorizontal: 6, 
    
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 21.78,
    fontFamily: "Inter_600SemiBold",
  },
  primaryButtonIcon: {
    marginLeft: 0,
  },
  secondaryButtonContainer: {
    alignItems: "center",
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24, 
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 18.15,
    textAlign: "center",
    fontFamily: "Inter_500Medium",
  },
});

