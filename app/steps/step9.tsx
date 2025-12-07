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
 * Экран девятого шага онбординга - Чего вы хотите достичь?
 */
export default function Step9() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const [selectedMotivation, setSelectedMotivation] = useState<string | null>("eat-healthy");

  if (!fontsLoaded) {
    return null;
  }

  const handleNextPress = () => {
    // TODO: Сохранить выбранное значение в состояние/БД
    console.log("Мотивация:", selectedMotivation);
    // Переход на экран результатов
    router.push({
      pathname: "/results",
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
        <StepHeader stepNumber={9} onBack={handleBackPress} />

        {/* Прогресс-бар */}
        <ProgressBar currentStep={9} totalSteps={9} />

        {/* Контент */}
        <View style={styles.contentContainer}>
          {/* Заголовок и подзаголовок */}
          <View style={styles.textSection}>
            <Text style={styles.title}>Чего вы хотите достичь?</Text>
            <Text style={styles.subtitle}>
              Ваша главная мотивация
            </Text>
          </View>

          {/* Варианты выбора */}
          <View style={styles.optionsContainer}>
            <RadioButton
              label="Питаться и жить здорово"
              selected={selectedMotivation === "eat-healthy"}
              onPress={() => setSelectedMotivation("eat-healthy")}
            />
            <RadioButton
              label="Повысить энергию и настроение"
              selected={selectedMotivation === "boost-energy"}
              onPress={() => setSelectedMotivation("boost-energy")}
            />
            <RadioButton
              label="Оставаться мотивированным"
              selected={selectedMotivation === "stay-motivated"}
              onPress={() => setSelectedMotivation("stay-motivated")}
            />
            <RadioButton
              label="Чувствовать себя лучше в теле"
              selected={selectedMotivation === "feel-better"}
              onPress={() => setSelectedMotivation("feel-better")}
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
