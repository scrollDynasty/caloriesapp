import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StepHeader from "../../components/features/StepHeader";
import { PrimaryButton } from "../../components/ui/Button";
import { DatePicker } from "../../components/ui/DatePicker";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useOnboarding } from "../../context/OnboardingContext";
import { useTheme } from "../../context/ThemeContext";
import { useFonts } from "../../hooks/use-fonts";

export default function Step4() {
  const { colors: themeColors } = useTheme();
  const fontsLoaded = useFonts();
  const router = useRouter();
  const { updateData } = useOnboarding();
  
  const [birthDate, setBirthDate] = useState(new Date(2007, 1, 15));

  if (!fontsLoaded) {
    return null;
  }

  const handleNextPress = () => {
    
    updateData({ birthDate });
    router.push({
      pathname: "/steps/step5",
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
        <StepHeader stepNumber={4} onBack={handleBackPress} />

        <ProgressBar currentStep={4} totalSteps={9} />

        <View style={styles.contentContainer}>
          <View style={styles.textSection}>
            <Text style={[styles.title, { color: themeColors.text }]}>Дата рождения</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Это поможет скорректировать программу питания
            </Text>
          </View>

          <View style={styles.pickerContainer}>
            <DatePicker value={birthDate} onValueChange={setBirthDate} />
          </View>
        </View>

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
  pickerContainer: {
    width: "100%",
    paddingTop: 0,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});

