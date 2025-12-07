import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StepHeader from "../../components/features/StepHeader";
import { PrimaryButton } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { RadioButton } from "../../components/ui/RadioButton";
import { colors } from "../../constants/theme";
import { useOnboarding } from "../../context/OnboardingContext";
import { useFonts } from "../../hooks/use-fonts";

/**
 * Экран восьмого шага онбординга - Ваш тип питания
 */
export default function Step8() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const { updateData } = useOnboarding();
  const [selectedDiet, setSelectedDiet] = useState<string | null>("classic");

  if (!fontsLoaded) {
    return null;
  }

  const handleNextPress = () => {
    if (!selectedDiet) {
      return;
    }
    // Сохраняем данные в контекст
    updateData({
      dietType: selectedDiet as "classic" | "pescatarian" | "vegetarian" | "vegan",
    });
    router.push({
      pathname: "/steps/step9",
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
        <StepHeader stepNumber={8} onBack={handleBackPress} />

        {/* Прогресс-бар */}
        <ProgressBar currentStep={8} totalSteps={9} />

        {/* Контент */}
        <View style={styles.contentContainer}>
          {/* Заголовок и подзаголовок */}
          <View style={styles.textSection}>
            <Text style={styles.title}>Ваш тип питания</Text>
            <Text style={styles.subtitle}>
              Какой диеты вы придерживаетесь?
            </Text>
          </View>

          {/* Варианты выбора */}
          <View style={styles.optionsContainer}>
            <RadioButton
              label="Классическая"
              selected={selectedDiet === "classic"}
              onPress={() => setSelectedDiet("classic")}
            />
            <RadioButton
              label="Пескетарианская"
              selected={selectedDiet === "pescatarian"}
              onPress={() => setSelectedDiet("pescatarian")}
            />
            <RadioButton
              label="Вегетарианец"
              selected={selectedDiet === "vegetarian"}
              onPress={() => setSelectedDiet("vegetarian")}
            />
            <RadioButton
              label="Веган"
              selected={selectedDiet === "vegan"}
              onPress={() => setSelectedDiet("vegan")}
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
    alignItems: "flex-start",
    marginBottom: 32,
    gap: 12,
  },
  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 33.88,
    textAlign: "left",
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    color: colors.secondary,
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
});
