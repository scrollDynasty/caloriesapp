import { StyleSheet, View } from "react-native";
import { colors } from "../../constants/theme";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * Компонент прогресс-бара для отображения прогресса прохождения шагов
 */
export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
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
    backgroundColor: "#E6E1D8",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});

