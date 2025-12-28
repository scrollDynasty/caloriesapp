import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StepHeader from "../../components/features/StepHeader";
import { PrimaryButton } from "../../components/ui/Button";
import { HeightWeightPicker } from "../../components/ui/HeightWeightPicker";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useOnboarding } from "../../context/OnboardingContext";
import { useTheme } from "../../context/ThemeContext";
import { useFonts } from "../../hooks/use-fonts";

export default function Step3() {
  const { colors: themeColors } = useTheme();
  const fontsLoaded = useFonts();
  const router = useRouter();
  const { updateData } = useOnboarding();
  const [height, setHeight] = useState<number>(175); 
  const [weight, setWeight] = useState<number>(70); 

  if (!fontsLoaded) {
    return null;
  }

  const handleNextPress = () => {
    
    updateData({ height, weight });
    router.push({
      pathname: "/steps/step4",
    } as any);
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {}
        <StepHeader stepNumber={3} onBack={handleBackPress} />

        {}
        <ProgressBar currentStep={3} totalSteps={9} />

        {}
        <View style={styles.contentContainer}>
          {}
          <View style={styles.textSection}>
            <Text style={[styles.title, { color: themeColors.text }]}>Рост и вес</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Укажите ваши параметры для точного расчета
            </Text>
          </View>

          {}
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

        {}
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
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 33.88,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  pickersContainer: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 0,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});

