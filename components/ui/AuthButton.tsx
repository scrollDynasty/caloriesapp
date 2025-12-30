import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constants/theme";
import { hapticMedium } from "../../utils/haptics";

interface AuthButtonProps {
  provider: "apple" | "google";
  onPress?: () => void;
  disabled?: boolean;
}

export function AuthButton({ provider, onPress, disabled = false }: AuthButtonProps) {
  const isApple = provider === "apple";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isApple ? styles.appleButton : styles.googleButton,
        disabled && styles.buttonDisabled,
      ]}
      onPress={() => {
        if (!disabled) {
          hapticMedium();
          onPress?.();
        }
      }}
      activeOpacity={0.8}
      disabled={disabled}
    >
      {}
      <View style={styles.iconContainer}>
        {isApple ? (
          <Ionicons name="logo-apple" size={24} color={colors.white} />
        ) : (
          <Ionicons name="logo-google" size={24} color={colors.primary} />
        )}
      </View>

      {}
      <Text
        style={[
          styles.buttonText,
          isApple ? styles.appleButtonText : styles.googleButtonText,
        ]}
      >
        Войти через {isApple ? "Apple" : "Google"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
    borderWidth: 1,
    
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appleButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderColor: "#E0E0E0",
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 19.36,
    fontFamily: "Inter_600SemiBold",
  },
  appleButtonText: {
    color: colors.white,
  },
  googleButtonText: {
    color: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
