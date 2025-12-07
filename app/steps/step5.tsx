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

export default function Step5() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const { updateData } = useOnboarding();
  const [hasTrainer, setHasTrainer] = useState<boolean | null>(true);

  if (!fontsLoaded) {
    return null;
  }

  const handleNextPress = () => {
    // Сохраняем данные в контекст
    updateData({ hasTrainer: hasTrainer ?? false });
    router.push({
      pathname: "/steps/step6",
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
        <StepHeader stepNumber={5} onBack={handleBackPress} />

        {/* Прогресс-бар */}
        <ProgressBar currentStep={5} totalSteps={9} />

        {/* Контент */}
        <View style={styles.contentContainer}>
          {/* Заголовок и подзаголовок */}
          <View style={styles.textSection}>
            <Text style={styles.title}>Работа с персональным тренером</Text>
            <Text style={styles.subtitle}>
              Хотите подключить профессиональное сопровождение?
            </Text>
          </View>

          {/* Варианты выбора */}
          <View style={styles.optionsContainer}>
            <RadioButton
              label="Да"
              selected={hasTrainer === true}
              onPress={() => setHasTrainer(true)}
            />
            <RadioButton
              label="Нет"
              selected={hasTrainer === false}
              onPress={() => setHasTrainer(false)}
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

