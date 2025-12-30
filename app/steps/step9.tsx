import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { apiService } from "../../services/api";
import { saveOnboardingData } from "../../services/onboarding";

const ONBOARDING_DATA_KEY = "@yebich:onboarding_data";

export default function Step9() {
  const { colors: themeColors } = useTheme();
  const fontsLoaded = useFonts();
  const router = useRouter();
  const { updateData, data: onboardingData } = useOnboarding();
  const [selectedMotivation, setSelectedMotivation] = useState<string | null>("eat-healthy");
  const [isSaving, setIsSaving] = useState(false);

  if (!fontsLoaded) {
    return null;
  }

  const handleNextPress = async () => {
    if (!selectedMotivation || isSaving) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      await updateData({ motivation: selectedMotivation });
      
      let finalData: any = { ...onboardingData, motivation: selectedMotivation };
      
      try {
        const storedData = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
        if (storedData) {
          const parsed = JSON.parse(storedData);
          finalData = { ...parsed };
        }
      } catch {
      }

      if (
        finalData.gender &&
        finalData.height &&
        finalData.weight &&
        finalData.workoutFrequency &&
        finalData.goal
      ) {
        const token = await apiService.getToken();
        if (token) {
          const result = await saveOnboardingData(finalData);
          if (result.success) {
            await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
          }
        }
      }
    } catch {
    } finally {
      setIsSaving(false);
    }
    
    router.push({
      pathname: "/results",
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
        <StepHeader stepNumber={9} onBack={handleBackPress} />

        {}
        <ProgressBar currentStep={9} totalSteps={9} />

        {}
        <View style={styles.contentContainer}>
          {}
          <View style={styles.textSection}>
            <Text style={[styles.title, { color: themeColors.text }]}>Чего вы хотите достичь?</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Ваша главная мотивация
            </Text>
          </View>

          {}
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

        {}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            label={isSaving ? "Сохранение..." : "Продолжить"}
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
    lineHeight: 33.88,
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
