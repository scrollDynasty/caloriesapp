import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useOnboarding } from "../context/OnboardingContext";
import { useTheme } from "../context/ThemeContext";
import { useFonts } from "../hooks/use-fonts";
import { UserData, calculateCalories } from "../utils/calorieCalculator";

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
  const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    "🔥": "flame",
    "🌾": "nutrition",
    "🥩": "restaurant",
    "💧": "water",
  };

  const iconName = iconMap[icon] || "ellipse-outline";

  return (
    <Animated.View 
      entering={FadeInUp.delay(delay).springify()}
      style={styles.macroRow}
    >
      <View style={styles.macroRowLeft}>
        <View style={[styles.macroIconContainer, { backgroundColor: isDark ? colors.fillTertiary : "rgba(0,0,0,0.04)" }]}>
          <Ionicons 
            name={iconName} 
            size={Platform.OS === "android" ? 18 : 20} 
            color={icon === "🔥" ? "#FF6B35" : icon === "🌾" ? "#FFA726" : icon === "🥩" ? "#EF5350" : "#42A5F5"} 
          />
        </View>
        <Text style={[styles.macroRowLabel, { color: colors.text }]}>{label}</Text>
        <TouchableOpacity style={styles.macroRowEdit}>
          <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.macroRowRight}>
        <CircularProgress
          progress={0}
          size={Platform.OS === "android" ? 48 : 56}
          strokeWidth={Platform.OS === "android" ? 3 : 4}
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
  const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    "💪": "fitness",
    "🥑": "leaf",
    "🎯": "locate",
    "⚡": "flash",
  };

  const iconName = iconMap[icon] || "ellipse-outline";

  return (
    <Animated.View entering={FadeInDown.delay(delay)} style={styles.tipItem}>
      <View style={[styles.tipIconContainer, { backgroundColor: isDark ? colors.fillQuaternary : "#FFFFF0" }]}>
        <Ionicons 
          name={iconName} 
          size={Platform.OS === "android" ? 20 : 22} 
          color={icon === "💪" ? "#FF6B35" : icon === "🥑" ? "#66BB6A" : icon === "🎯" ? "#42A5F5" : "#FFA726"} 
        />
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
        {}
        <Animated.View entering={FadeIn.delay(100)} style={styles.headerSection}>
          <View style={[styles.checkIcon, { backgroundColor: colors.text }]}>
            <Ionicons name="checkmark" size={Platform.OS === "android" ? 24 : 28} color={isDark ? colors.black : colors.buttonPrimaryText} />
          </View>
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            Поздравляем{"\n"}твой индивидуальный план готов!
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Тебе следует {goalText}:
          </Text>
          <View style={[styles.weightBadge, { backgroundColor: colors.text }]}>
            <Text style={[styles.weightText, { color: isDark ? colors.black : colors.buttonPrimaryText }]}>
              {onboardingData.weight} кг
            </Text>
          </View>
        </Animated.View>

        {}
        <Animated.View 
          entering={FadeInUp.delay(300).springify()}
          style={[styles.recommendationCard, { backgroundColor: isDark ? colors.card : "#FFFFF0" }]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Ежедневная рекомендация</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Ты можешь изменить это в любое время
          </Text>

          {}
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

          {}
          <Animated.View 
            entering={FadeInUp.delay(800)}
            style={[styles.healthScore, { backgroundColor: isDark ? colors.fillTertiary : "#FFFFF0" }]}
          >
            <View style={[styles.healthIcon, { backgroundColor: isDark ? colors.fillQuaternary : "rgba(255, 107, 53, 0.1)" }]}>
              <Ionicons name="fitness" size={Platform.OS === "android" ? 20 : 24} color="#FF6B35" />
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

        {}
        <Animated.View 
          entering={FadeInUp.delay(900).springify()}
          style={[styles.tipsCard, { backgroundColor: isDark ? colors.card : "#FFFFF0" }]}
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

        {}
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

      {}
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
    paddingHorizontal: Platform.OS === "android" ? 20 : 24,
    paddingBottom: Platform.OS === "android" ? 100 : 120,
  },
  headerSection: {
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 20 : 24,
    marginBottom: Platform.OS === "android" ? 20 : 24,
  },
  checkIcon: {
    width: Platform.OS === "android" ? 48 : 56,
    height: Platform.OS === "android" ? 48 : 56,
    borderRadius: Platform.OS === "android" ? 24 : 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Platform.OS === "android" ? 16 : 20,
  },
  mainTitle: {
    fontSize: Platform.OS === "android" ? 22 : 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: Platform.OS === "android" ? 27 : 30,
    marginBottom: Platform.OS === "android" ? 12 : 16,
  },
  subtitle: {
    fontSize: Platform.OS === "android" ? 14 : 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: Platform.OS === "android" ? 10 : 12,
  },
  weightBadge: {
    paddingHorizontal: Platform.OS === "android" ? 16 : 20,
    paddingVertical: Platform.OS === "android" ? 8 : 10,
    borderRadius: Platform.OS === "android" ? 20 : 24,
  },
  weightText: {
    fontSize: Platform.OS === "android" ? 16 : 18,
    fontFamily: "Inter_700Bold",
  },
  recommendationCard: {
    padding: Platform.OS === "android" ? 16 : 20,
    borderRadius: Platform.OS === "android" ? 20 : 24,
    marginBottom: Platform.OS === "android" ? 16 : 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: Platform.OS === "android" ? 16 : 18,
    fontFamily: "Inter_700Bold",
    marginBottom: Platform.OS === "android" ? 4 : 6,
  },
  cardSubtitle: {
    fontSize: Platform.OS === "android" ? 13 : 14,
    fontFamily: "Inter_400Regular",
    marginBottom: Platform.OS === "android" ? 16 : 20,
  },
  macrosList: {
    marginBottom: 16,
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Platform.OS === "android" ? 12 : 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  macroRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Platform.OS === "android" ? 8 : 10,
  },
  macroIconContainer: {
    width: Platform.OS === "android" ? 32 : 36,
    height: Platform.OS === "android" ? 32 : 36,
    borderRadius: Platform.OS === "android" ? 16 : 18,
    alignItems: "center",
    justifyContent: "center",
  },
  macroRowLabel: {
    fontSize: Platform.OS === "android" ? 14 : 16,
    fontFamily: "Inter_600SemiBold",
  },
  macroRowEdit: {
    padding: 4,
  },
  macroRowRight: {
    alignItems: "center",
  },
  macroRowValue: {
    fontSize: Platform.OS === "android" ? 12 : 14,
    fontFamily: "Inter_700Bold",
  },
  healthScore: {
    flexDirection: "row",
    alignItems: "center",
    padding: Platform.OS === "android" ? 12 : 16,
    borderRadius: Platform.OS === "android" ? 14 : 16,
    gap: Platform.OS === "android" ? 10 : 12,
  },
  healthIcon: {
    width: Platform.OS === "android" ? 36 : 40,
    height: Platform.OS === "android" ? 36 : 40,
    borderRadius: Platform.OS === "android" ? 18 : 20,
    alignItems: "center",
    justifyContent: "center",
  },
  healthInfo: {
    flex: 1,
  },
  healthLabel: {
    fontSize: Platform.OS === "android" ? 13 : 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: Platform.OS === "android" ? 6 : 8,
  },
  healthBar: {
    height: Platform.OS === "android" ? 5 : 6,
    borderRadius: Platform.OS === "android" ? 2.5 : 3,
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    borderRadius: Platform.OS === "android" ? 2.5 : 3,
  },
  healthValue: {
    fontSize: Platform.OS === "android" ? 14 : 16,
    fontFamily: "Inter_700Bold",
  },
  tipsCard: {
    padding: Platform.OS === "android" ? 16 : 20,
    borderRadius: Platform.OS === "android" ? 20 : 24,
    marginBottom: Platform.OS === "android" ? 16 : 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tipsTitle: {
    fontSize: Platform.OS === "android" ? 15 : 17,
    fontFamily: "Inter_700Bold",
    marginBottom: Platform.OS === "android" ? 12 : 16,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Platform.OS === "android" ? 10 : 12,
    gap: Platform.OS === "android" ? 12 : 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  tipIconContainer: {
    width: Platform.OS === "android" ? 38 : 44,
    height: Platform.OS === "android" ? 38 : 44,
    borderRadius: Platform.OS === "android" ? 19 : 22,
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: {
    flex: 1,
    fontSize: Platform.OS === "android" ? 14 : 15,
    fontFamily: "Inter_500Medium",
    lineHeight: Platform.OS === "android" ? 18 : 20,
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
    paddingHorizontal: Platform.OS === "android" ? 20 : 24,
    paddingVertical: Platform.OS === "android" ? 16 : 20,
    paddingBottom: Platform.OS === "android" ? 32 : 40,
  },
  continueButton: {
    paddingVertical: Platform.OS === "android" ? 14 : 16,
    borderRadius: Platform.OS === "android" ? 14 : 16,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: Platform.OS === "android" ? 15 : 17,
    fontFamily: "Inter_600SemiBold",
  },
});
