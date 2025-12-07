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
 * Экран шестого шага онбординга - Цель пользователя
 */
export default function Step6() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<string | null>("maintain");

  if (!fontsLoaded) {
    return null;
  }

  const handleNextPress = () => {
    // TODO: Сохранить выбранное значение в состояние/БД
    console.log("Цель пользователя:", selectedGoal);
    router.push({
      pathname: "/steps/step7",
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
        <StepHeader stepNumber={6} onBack={handleBackPress} />

        {/* Прогресс-бар */}
        <ProgressBar currentStep={6} totalSteps={9} />

        {/* Контент */}
        <View style={styles.contentContainer}>
          {/* Заголовок и подзаголовок */}
          <View style={styles.textSection}>
            <Text style={styles.title}>Цель пользователя</Text>
            <Text style={styles.subtitle}>
              Выберите, к чему вы стремитесь
            </Text>
          </View>

          {/* Варианты выбора */}
          <View style={styles.optionsContainer}>
            <RadioButton
              label="Похудеть"
              selected={selectedGoal === "lose"}
              onPress={() => setSelectedGoal("lose")}
            />
            <RadioButton
              label="Поддерживать вес"
              selected={selectedGoal === "maintain"}
              onPress={() => setSelectedGoal("maintain")}
            />
            <RadioButton
              label="Набрать вес"
              selected={selectedGoal === "gain"}
              onPress={() => setSelectedGoal("gain")}
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
