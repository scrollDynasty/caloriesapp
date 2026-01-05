import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StepHeader from "../../components/features/StepHeader";
import { PrimaryButton } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { RadioButton } from "../../components/ui/RadioButton";
import { useOnboarding } from "../../context/OnboardingContext";
import { useTheme } from "../../context/ThemeContext";
import { useFonts } from "../../hooks/use-fonts";

export default function Step6() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { updateData } = useOnboarding();
  const [selectedGoal, setSelectedGoal] = useState<string | null>("maintain");

  if (!fontsLoaded) {
    return null;
  }

  const handleNextPress = () => {
    if (!selectedGoal) {
      return;
    }
    
    updateData({ goal: selectedGoal as "lose" | "maintain" | "gain" });
    router.push({
      pathname: "/steps/step7",
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
        <StepHeader stepNumber={6} onBack={handleBackPress} />

        <ProgressBar currentStep={6} totalSteps={9} />

        <View style={styles.contentContainer}>
          <View style={styles.textSection}>
            <Text style={[styles.title, { color: colors.text }]}>Какова твоя цель?</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Это помогает нам составить план по твоему потреблению калорий.
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            <RadioButton
              label="Похудеть"
              selected={selectedGoal === "lose"}
              onPress={() => setSelectedGoal("lose")}
            />
            <RadioButton
              label="Поддерживать"
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

        <View style={styles.buttonContainer}>
          <PrimaryButton
            label="Автогенерация целей"
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
});
