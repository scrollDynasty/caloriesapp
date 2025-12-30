import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StepHeader from "../../components/features/StepHeader";
import { PrimaryButton } from "../../components/ui/Button";
import { GenderRadioButton } from "../../components/ui/GenderRadioButton";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useOnboarding } from "../../context/OnboardingContext";
import { useTheme } from "../../context/ThemeContext";
import { useFonts } from "../../hooks/use-fonts";

type Gender = "male" | "female";

export default function Step1() {
  const { colors: themeColors } = useTheme();
  const fontsLoaded = useFonts();
  const router = useRouter();
  const { updateData } = useOnboarding();
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);

  if (!fontsLoaded) {
    return null;
  }

  const handleNextPress = () => {
    if (!selectedGender) {
      return;
    }
    
    updateData({ gender: selectedGender });
    
    router.push({
      pathname: "/steps/step3",
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
        <StepHeader stepNumber={1} />

        {}
        <ProgressBar currentStep={1} totalSteps={9} />

        {}
        <View style={styles.contentContainer}>
          {}
          <View style={styles.textSection}>
            <Text style={[styles.title, { color: themeColors.text }]}>Выберите пол</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Это поможет нам рассчитать вашу суточную норму калорий
            </Text>
          </View>

          {}
          <View style={styles.optionsContainer}>
            <GenderRadioButton
              label="Мужской"
              icon="man"
              selected={selectedGender === "male"}
              onPress={() => setSelectedGender("male")}
            />
            <GenderRadioButton
              label="Женский"
              icon="woman"
              selected={selectedGender === "female"}
              onPress={() => setSelectedGender("female")}
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
  optionsContainer: {
    flexDirection: "row",
    gap: 16,
    alignSelf: "stretch",
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});

