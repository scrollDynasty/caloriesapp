import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constants/theme";

interface StepHeaderProps {
  stepNumber: number;
  onBack?: () => void;
}

export default function StepHeader({
  stepNumber,
  onBack,
}: StepHeaderProps) {
  return (
    <View style={styles.headerContainer}>
      {onBack ? (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backButtonPlaceholder} />
      )}
      <Text style={styles.stepIndicator}>Шаг {stepNumber}</Text>
      <View style={styles.backButtonPlaceholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  backButton: {
    width: 32,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 8,
    marginLeft: -8,
  },
  backButtonPlaceholder: {
    width: 32,
    height: 40,
  },
  stepIndicator: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 16.94,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    flex: 1,
  },
});

