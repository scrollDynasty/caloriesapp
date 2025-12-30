import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import StepHeader from "../../components/features/StepHeader";
import { PrimaryButton } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useOnboarding } from "../../context/OnboardingContext";
import { useTheme } from "../../context/ThemeContext";
import { useFonts } from "../../hooks/use-fonts";
import { hapticLight, hapticMedium } from "../../utils/haptics";

type WorkoutFrequency = "0-2" | "3-5" | "6+";

interface WorkoutOptionProps {
  dots: number;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}

function WorkoutOption({ dots, title, subtitle, selected, onPress }: WorkoutOptionProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    hapticLight();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (!selected) {
      hapticMedium();
    }
    onPress();
  };
  const containerBg = selected 
    ? (isDark ? "#FFFFFF" : "#000000") 
    : colors.card;
  const textColor = selected 
    ? (isDark ? "#000000" : "#FFFFFF") 
    : colors.text;
  const subtitleColor = selected 
    ? (isDark ? "#000000" : "#FFFFFF") 
    : colors.textSecondary;
  const borderColor = selected 
    ? "transparent" 
    : colors.border;
  const dotColor = selected 
    ? (isDark ? "#000000" : "#FFFFFF") 
    : colors.text;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.workoutOption,
          {
            backgroundColor: containerBg,
            borderColor: borderColor,
          },
          animatedStyle,
        ]}
      >
        <View style={styles.workoutDots}>
          {Array.from({ length: dots }).map((_, i) => (
            <View
              key={i}
              style={[styles.workoutDot, { backgroundColor: dotColor }]}
            />
          ))}
        </View>
        <View style={styles.workoutInfo}>
          <Text style={[styles.workoutTitle, { color: textColor }]}>{title}</Text>
          <Text style={[styles.workoutSubtitle, { color: subtitleColor }]}>{subtitle}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function Step5() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const { colors } = useTheme();
  const { updateData } = useOnboarding();
  const [selectedFrequency, setSelectedFrequency] = useState<WorkoutFrequency>("3-5");

  if (!fontsLoaded) {
    return null;
  }

  const handleNextPress = () => {
    updateData({ workoutFrequency: selectedFrequency });
    router.push({
      pathname: "/steps/step6",
    } as any);
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StepHeader stepNumber={5} onBack={handleBackPress} />
        <ProgressBar currentStep={5} totalSteps={9} />

        <View style={styles.contentContainer}>
          <View style={styles.textSection}>
            <Text style={[styles.title, { color: colors.text }]}>
              Сколько тренировок ты делаешь в неделю?
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Это будет использовано для настройки твоего индивидуального плана.
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            <WorkoutOption
              dots={1}
              title="0-2"
              subtitle="Тренировки время от времени"
              selected={selectedFrequency === "0-2"}
              onPress={() => setSelectedFrequency("0-2")}
            />
            <WorkoutOption
              dots={2}
              title="3-5"
              subtitle="Несколько тренировок в неделю"
              selected={selectedFrequency === "3-5"}
              onPress={() => setSelectedFrequency("3-5")}
            />
            <WorkoutOption
              dots={3}
              title="6+"
              subtitle="Серьёзный спортсмен"
              selected={selectedFrequency === "6+"}
              onPress={() => setSelectedFrequency("6+")}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            label="Далее"
            onPress={handleNextPress}
            icon={null}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  textSection: {
    alignItems: "flex-start",
    marginBottom: 32,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    textAlign: "left",
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    textAlign: "left",
    fontFamily: "Inter_400Regular",
  },
  optionsContainer: {
    width: "100%",
    gap: 16,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  workoutOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  workoutDots: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  workoutDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  workoutSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
