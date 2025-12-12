import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/ui/Button";
import { colors } from "../constants/theme";
import { useOnboarding } from "../context/OnboardingContext";
import { useFonts } from "../hooks/use-fonts";
import { calculateCalories, UserData } from "../utils/calorieCalculator";

export default function Results() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const { data: onboardingData } = useOnboarding();

  if (!fontsLoaded) {
    return null;
  }

  const userData: UserData | null = onboardingData.gender &&
    onboardingData.height &&
    onboardingData.weight &&
    onboardingData.workoutFrequency &&
    onboardingData.goal
    ? {
        gender: onboardingData.gender,
        age: onboardingData.birthDate
          ? new Date().getFullYear() - new Date(onboardingData.birthDate).getFullYear()
          : 25,
        height: onboardingData.height,
        weight: onboardingData.weight,
        workoutFrequency: onboardingData.workoutFrequency,
        goal: onboardingData.goal,
      }
    : null;

  const result = userData ? calculateCalories(userData) : null;

  if (!result) {
    
    return null;
  }

  const handleStartPress = () => {
    
    router.push({
      pathname: "/save-progress",
    } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {}
        <View style={styles.contentContainer}>
          {}
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="trophy" size={48} color={colors.primary} />
            </View>
            <Text style={styles.mainTitle}>Спасибо, что доверяешь нам</Text>
            <Text style={styles.subtitle}>Ваш персональный план готов</Text>
          </View>

          {}
          <View style={styles.caloriesSection}>
            <Text style={styles.caloriesValue}>{result?.targetCalories || 0}</Text>
            <Text style={styles.caloriesLabel}>ккал / день</Text>
          </View>

          {}
          <View style={styles.macrosSection}>
            <View style={styles.macroCard}>
              <Text style={styles.macroValue}>
                {result?.macros.carbs.grams || 0}
              </Text>
              <Text style={styles.macroUnit}>г</Text>
              <Text style={styles.macroLabel}>Углеводы</Text>
            </View>
            <View style={styles.macroCard}>
              <Text style={styles.macroValue}>
                {result?.macros.protein.grams || 0}
              </Text>
              <Text style={styles.macroUnit}>г</Text>
              <Text style={styles.macroLabel}>Белки</Text>
            </View>
            <View style={styles.macroCard}>
              <Text style={styles.macroValue}>
                {result?.macros.fats.grams || 0}
              </Text>
              <Text style={styles.macroUnit}>г</Text>
              <Text style={styles.macroLabel}>Жиры</Text>
            </View>
          </View>
        </View>

        {}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            label="Начать путь"
            onPress={handleStartPress}
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mainTitle: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 33.88,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  subtitle: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  caloriesSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  caloriesValue: {
    color: colors.primary,
    fontSize: 64,
    fontWeight: "700",
    lineHeight: 77.45,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  caloriesLabel: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: "400",
    lineHeight: 21.78,
    fontFamily: "Inter_400Regular",
  },
  macrosSection: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    width: "100%",
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    minWidth: 100,
    
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  macroValue: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38.73,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  macroUnit: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 16.94,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  macroLabel: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 16.94,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});
