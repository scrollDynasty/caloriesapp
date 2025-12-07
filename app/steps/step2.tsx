import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StepHeader from "../../components/features/StepHeader";
import { PrimaryButton } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { RadioButton } from "../../components/ui/RadioButton";
import { colors } from "../../constants/theme";
import { useFonts } from "../../hooks/use-fonts";
import { useOnboarding } from "../../context/OnboardingContext";

type WorkoutFrequency = "0-2" | "3-5" | "6+";

/**
 * Экран второго шага онбординга - Количество тренировок
 */
export default function Step2() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const { updateData } = useOnboarding();
  const [selectedFrequency, setSelectedFrequency] =
    useState<WorkoutFrequency | null>(null);

  if (!fontsLoaded) {
    return null;
  }

  const handleNextPress = () => {
    if (!selectedFrequency) {
      // TODO: Показать ошибку валидации
      return;
    }
    // Сохраняем данные в контекст
    updateData({ workoutFrequency: selectedFrequency });
    // Переход на следующий шаг
    router.push({
      pathname: "/steps/step3",
    } as any);
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Заголовок с индикатором шага */}
        <StepHeader stepNumber={2} onBack={handleBackPress} />

        {/* Прогресс-бар */}
        <ProgressBar currentStep={2} totalSteps={9} />

        {/* Контент */}
        <View style={styles.contentContainer}>
          {/* Заголовок и подзаголовок */}
          <View style={styles.textSection}>
            <Text style={styles.title}>Количество тренировок</Text>
            <Text style={styles.subtitle}>
              Сколько раз в неделю вы занимаетесь?
            </Text>
          </View>

          {/* Варианты выбора */}
          <View style={styles.optionsContainer}>
            <RadioButton
              label="0–2 тренировки"
              selected={selectedFrequency === "0-2"}
              onPress={() => setSelectedFrequency("0-2")}
            />
            <RadioButton
              label="3–5 тренировок"
              selected={selectedFrequency === "3-5"}
              onPress={() => setSelectedFrequency("3-5")}
            />
            <RadioButton
              label="6+ тренировок"
              selected={selectedFrequency === "6+"}
              onPress={() => setSelectedFrequency("6+")}
            />
          </View>
        </View>

        {/* Кнопка "Продолжить" */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            label="Продолжить"
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
    backgroundColor: colors.background,
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
    alignItems: "center",
    marginBottom: 40,
    gap: 12,
  },
  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 33.88,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  optionsContainer: {
    gap: 16,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});
