import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StepHeader from "../../components/features/StepHeader";
import { PrimaryButton } from "../../components/ui/Button";
import { HeightWeightPicker } from "../../components/ui/HeightWeightPicker";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { colors } from "../../constants/theme";
import { useFonts } from "../../hooks/use-fonts";

/**
 * Экран третьего шага онбординга - Рост и вес
 */
export default function Step3() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const [height, setHeight] = useState<number>(175); // Значение по умолчанию
  const [weight, setWeight] = useState<number>(70); // Значение по умолчанию

  if (!fontsLoaded) {
    return null;
  }

  const handleNextPress = () => {
    // TODO: Сохранить выбранные значения в состояние/БД
    // TODO: Переход на следующий шаг (step4)
    console.log("Рост:", height, "Вес:", weight);
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
        <StepHeader stepNumber={3} onBack={handleBackPress} />

        {/* Прогресс-бар */}
        <ProgressBar currentStep={3} totalSteps={9} />

        {/* Контент */}
        <View style={styles.contentContainer}>
          {/* Заголовок и подзаголовок */}
          <View style={styles.textSection}>
            <Text style={styles.title}>Рост и вес</Text>
            <Text style={styles.subtitle}>
              Укажите ваши параметры для точного расчета
            </Text>
          </View>

          {/* Пикеры для роста и веса */}
          <View style={styles.pickersContainer}>
            <HeightWeightPicker
              label="Рост"
              value={height}
              onValueChange={setHeight}
              unit="см"
              min={140}
              max={220}
            />
            <HeightWeightPicker
              label="Вес"
              value={weight}
              onValueChange={setWeight}
              unit="кг"
              min={40}
              max={150}
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
    marginBottom: 20,
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
  pickersContainer: {
    flexDirection: "row",
    gap: 24,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 20,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});

