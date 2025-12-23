import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const { colors, isDark } = useTheme();
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarBackground, { backgroundColor: isDark ? colors.fillTertiary : "#E6E1D8" }]}>
        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: colors.text }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressBarContainer: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 0,
  },
  progressBarBackground: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
});
