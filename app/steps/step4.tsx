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

/**
 * Экран четвертого шага онбординга
 */
export default function Step4() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!fontsLoaded) {
    return null;
  }

  const handleNextPress = () => {
    if (!selectedOption) {
      // TODO: Показать ошибку валидации
      return;
    }
    // TODO: Сохранить выбранное значение в состояние/БД
    // TODO: Переход на следующий шаг (step5)
    console.log("Выбрано:", selectedOption);
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
        <StepHeader stepNumber={4} onBack={handleBackPress} />

        {/* Прогресс-бар */}
        <ProgressBar currentStep={4} totalSteps={9} />

        {/* Контент */}
        <View style={styles.contentContainer}>
          {/* Заголовок и подзаголовок */}
          <View style={styles.textSection}>
            <Text style={styles.title}>Заголовок шага 4</Text>
            <Text style={styles.subtitle}>
              Подзаголовок шага 4
            </Text>
          </View>

          {/* Варианты выбора */}
          <View style={styles.optionsContainer}>
            <RadioButton
              label="Опция 1"
              selected={selectedOption === "option1"}
              onPress={() => setSelectedOption("option1")}
            />
            <RadioButton
              label="Опция 2"
              selected={selectedOption === "option2"}
              onPress={() => setSelectedOption("option2")}
            />
            <RadioButton
              label="Опция 3"
              selected={selectedOption === "option3"}
              onPress={() => setSelectedOption("option3")}
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

