import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useOnboarding } from "../context/OnboardingContext";
import { useTheme } from "../context/ThemeContext";
import { useFonts } from "../hooks/use-fonts";
import { calculateCalories, UserData } from "../utils/calorieCalculator";

function CircularProgress({
  progress,
  size = 48,
  strokeWidth = 4,
  color,
  backgroundColor,
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  backgroundColor: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(1, progress));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {progress > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      {children}
    </View>
  );
}

function MacroRow({
  icon,
  label,
  value,
  unit,
  delay,
  isDark,
  colors,
}: {
  icon: string;
  label: string;
  value: number;
  unit: string;
  delay: number;
  isDark: boolean;
  colors: any;
}) {
  return (
    <Animated.View 
      entering={FadeInUp.delay(delay).springify()}
      style={styles.macroRow}
    >
      <View style={styles.macroRowLeft}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
        <Text style={[styles.macroRowLabel, { color: colors.text }]}>{label}</Text>
        <TouchableOpacity style={styles.macroRowEdit}>
          <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.macroRowRight}>
        <CircularProgress
          progress={0}
          size={56}
          strokeWidth={4}
          color={isDark ? colors.textSecondary : "#E0E0E0"}
          backgroundColor={isDark ? colors.fillTertiary : "#F0F0F0"}
        >
          <Text style={[styles.macroRowValue, { color: colors.text }]}>
            {value}{unit}
          </Text>
        </CircularProgress>
      </View>
    </Animated.View>
  );
}

function TipItem({ icon, text, delay, isDark, colors }: { icon: string; text: string; delay: number; isDark: boolean; colors: any }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay)} style={styles.tipItem}>
      <View style={[styles.tipIconContainer, { backgroundColor: isDark ? colors.fillQuaternary : "rgba(0,0,0,0.04)" }]}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text style={[styles.tipText, { color: colors.text }]}>{text}</Text>
    </Animated.View>
  );
}

export default function Results() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const { colors, isDark } = useTheme();
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

  const goalText = onboardingData.goal === "lose" 
    ? "похудеть до" 
    : onboardingData.goal === "gain" 
    ? "набрать до" 
    : "поддерживать";

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.headerSection}>
          <View style={[styles.checkIcon, { backgroundColor: colors.text }]}>
            <Ionicons name="checkmark" size={28} color={isDark ? colors.black : colors.white} />
          </View>
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            Поздравляем{"\n"}твой индивидуальный план готов!
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Тебе следует {goalText}:
          </Text>
          <View style={[styles.weightBadge, { backgroundColor: colors.text }]}>
            <Text style={[styles.weightText, { color: isDark ? colors.black : colors.white }]}>
              {onboardingData.weight} кг
            </Text>
          </View>
        </Animated.View>

        {/* Daily Recommendation Card */}
        <Animated.View 
          entering={FadeInUp.delay(300).springify()}
          style={[styles.recommendationCard, { backgroundColor: isDark ? colors.card : "#FFFFFF" }]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Ежедневная рекомендация</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Ты можешь изменить это в любое время
          </Text>

          {/* Macros List - вертикальный список */}
          <View style={styles.macrosList}>
            <MacroRow
              icon="🔥"
              label="Калории"
              value={result.targetCalories}
              unit=""
              delay={400}
              isDark={isDark}
              colors={colors}
            />
            <MacroRow
              icon="🌾"
              label="Углеводы"
              value={result.macros.carbs.grams}
              unit="г"
              delay={500}
              isDark={isDark}
              colors={colors}
            />
            <MacroRow
              icon="🥩"
              label="Белки"
              value={result.macros.protein.grams}
              unit="г"
              delay={600}
              isDark={isDark}
              colors={colors}
            />
            <MacroRow
              icon="💧"
              label="Жиры"
              value={result.macros.fats.grams}
              unit="г"
              delay={700}
              isDark={isDark}
              colors={colors}
            />
          </View>

          {/* Health Score */}
          <Animated.View 
            entering={FadeInUp.delay(800)}
            style={[styles.healthScore, { backgroundColor: isDark ? colors.fillTertiary : "#F8F8F8" }]}
          >
            <View style={styles.healthIcon}>
              <Text style={{ fontSize: 24 }}>💪</Text>
            </View>
            <View style={styles.healthInfo}>
              <Text style={[styles.healthLabel, { color: colors.text }]}>Оценка здоровья</Text>
              <View style={[styles.healthBar, { backgroundColor: colors.fillTertiary }]}>
                <View style={[styles.healthFill, { width: "70%", backgroundColor: colors.success }]} />
              </View>
            </View>
            <Text style={[styles.healthValue, { color: colors.text }]}>7/10</Text>
          </Animated.View>
        </Animated.View>

        {/* Tips Card */}
        <Animated.View 
          entering={FadeInUp.delay(900).springify()}
          style={[styles.tipsCard, { backgroundColor: isDark ? colors.card : "#FFFFFF" }]}
        >
          <Text style={[styles.tipsTitle, { color: colors.text }]}>Как достичь своих целей:</Text>
          
          <TipItem
            icon="💪"
            text="Используй оценки здоровья, чтобы улучшить свои привычки"
            delay={1000}
            isDark={isDark}
            colors={colors}
          />
          <TipItem
            icon="🥑"
            text="Отслеживай питание"
            delay={1100}
            isDark={isDark}
            colors={colors}
          />
          <TipItem
            icon="🎯"
            text="Следуй своей дневной норме калорий"
            delay={1200}
            isDark={isDark}
            colors={colors}
          />
          <TipItem
            icon="⚡"
            text="Сбалансируй углеводы, белки и жиры"
            delay={1300}
            isDark={isDark}
            colors={colors}
          />
        </Animated.View>

        {/* Sources */}
        <View style={styles.sourcesSection}>
          <Text style={[styles.sourcesTitle, { color: colors.textSecondary }]}>
            План основан на следующих источниках, среди прочих рецензируемых медицинских исследований:
          </Text>
          <Text style={[styles.sourceItem, { color: colors.info }]}>• Основной обмен веществ</Text>
          <Text style={[styles.sourceItem, { color: colors.info }]}>• Подсчёт калорий — Гарвард</Text>
          <Text style={[styles.sourceItem, { color: colors.info }]}>• Международное общество спортивного питания</Text>
          <Text style={[styles.sourceItem, { color: colors.info }]}>• Национальные институты здоровья</Text>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.buttonPrimary }]}
          onPress={handleStartPress}
        >
          <Text style={[styles.continueButtonText, { color: colors.buttonPrimaryText }]}>
            Продолжить
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  headerSection: {
    alignItems: "center",
    paddingTop: 24,
    marginBottom: 24,
  },
  checkIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 12,
  },
  weightBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  weightText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  recommendationCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  macrosList: {
    marginBottom: 16,
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  macroRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  macroRowLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  macroRowEdit: {
    padding: 4,
  },
  macroRowRight: {
    alignItems: "center",
  },
  macroRowValue: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  healthScore: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  healthIcon: {},
  healthInfo: {
    flex: 1,
  },
  healthLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  healthBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    borderRadius: 3,
  },
  healthValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  tipsCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  tipIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  sourcesSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  sourcesTitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 12,
  },
  sourceItem: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 24,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  continueButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
});
