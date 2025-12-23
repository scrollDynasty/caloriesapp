import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface StepHeaderProps {
  stepNumber: number;
  onBack?: () => void;
}

export default function StepHeader({
  stepNumber,
  onBack,
}: StepHeaderProps) {
  const { colors, isDark } = useTheme();
  
  return (
    <View style={styles.headerContainer}>
      {onBack ? (
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? colors.card : colors.backgroundSecondary }]}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backButtonPlaceholder} />
      )}
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
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonPlaceholder: {
    width: 44,
    height: 44,
  },
});
