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

export default function Step7() {
  const { colors: themeColors } = useTheme();
  const fontsLoaded = useFonts();
  const router = useRouter();
  const { updateData } = useOnboarding();
  const [selectedBarrier, setSelectedBarrier] = useState<string | null>("lack-of-ideas");

  if (!fontsLoaded) {
    return null;
  }

  const handleNextPress = () => {
    if (!selectedBarrier) {
      return;
    }
    
    updateData({ barrier: selectedBarrier });
    router.push({
      pathname: "/steps/step8",
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
        <StepHeader stepNumber={7} onBack={handleBackPress} />

        {}
        <ProgressBar currentStep={7} totalSteps={9} />

        {}
        <View style={styles.contentContainer}>
          {}
          <View style={styles.textSection}>
            <Text style={[styles.title, { color: themeColors.text }]}>Что мешает достигать цели</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Выберите основной барьер
            </Text>
          </View>

          {}
          <View style={styles.optionsContainer}>
            <RadioButton
              label="Непоследовательность"
              selected={selectedBarrier === "inconsistency"}
              onPress={() => setSelectedBarrier("inconsistency")}
            />
            <RadioButton
              label="Вредные пищевые привычки"
              selected={selectedBarrier === "bad-habits"}
              onPress={() => setSelectedBarrier("bad-habits")}
            />
            <RadioButton
              label="Отсутствие поддержки"
              selected={selectedBarrier === "lack-of-support"}
              onPress={() => setSelectedBarrier("lack-of-support")}
            />
            <RadioButton
              label="Загруженный график"
              selected={selectedBarrier === "busy-schedule"}
              onPress={() => setSelectedBarrier("busy-schedule")}
            />
            <RadioButton
              label="Нехватка идей или блюд"
              selected={selectedBarrier === "lack-of-ideas"}
              onPress={() => setSelectedBarrier("lack-of-ideas")}
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
