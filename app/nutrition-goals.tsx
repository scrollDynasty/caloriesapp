import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    useSharedValue,
    withTiming
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { LottieLoader } from "../components/ui/LottieLoader";
import { RadioButton } from "../components/ui/RadioButton";
import { useAppSettings } from "../context/AppSettingsContext";
import { useTheme } from "../context/ThemeContext";
import { useFonts } from "../hooks/use-fonts";
import { apiService } from "../services/api";
import { dataCache } from "../stores/dataCache";
import { UserData, calculateCalories } from "../utils/calorieCalculator";
import { hapticLight, hapticMedium, hapticSuccess } from "../utils/haptics";

const SCREEN_WIDTH = Dimensions.get("window").width;

// Кросс-платформный компонент для выбора чисел
// iOS: красивый пикер, Android: простой TextInput
const NumericInput = React.memo(function NumericInput({
  value,
  onChangeValue,
  unit,
  min,
  max,
  step = 1,
  colors,
}: {
  value: string;
  onChangeValue: (value: string) => void;
  unit: string;
  min: number;
  max: number;
  step?: number;
  colors: any;
}) {
  const [inputValue, setInputValue] = useState(value);

  const handleChangeText = useCallback((text: string) => {
    const numValue = parseInt(text) || 0;
    if (numValue >= min && numValue <= max) {
      setInputValue(text);
      onChangeValue(text);
    } else if (text === "") {
      setInputValue("");
    }
  }, [min, max, onChangeValue]);

  const incrementValue = useCallback(() => {
    const current = parseInt(inputValue) || min;
    const newValue = Math.min(current + step, max);
    setInputValue(String(newValue));
    onChangeValue(String(newValue));
  }, [inputValue, min, max, step, onChangeValue]);

  const decrementValue = useCallback(() => {
    const current = parseInt(inputValue) || max;
    const newValue = Math.max(current - step, min);
    setInputValue(String(newValue));
    onChangeValue(String(newValue));
  }, [inputValue, min, max, step, onChangeValue]);

  return (
    <View style={{ gap: 16 }}>
      {Platform.OS === "android" ? (
        // Android: простой TextInput с кнопками
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 2,
          borderRadius: 12,
          borderColor: colors.primary,
          paddingHorizontal: 8,
          gap: 8,
          height: 56,
        }}>
          <TouchableOpacity 
            onPress={decrementValue}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: colors.backgroundSecondary,
            }}
          >
            <Text style={{ fontSize: 24, color: colors.primary }}>−</Text>
          </TouchableOpacity>
          
          <TextInput
            value={inputValue}
            onChangeText={handleChangeText}
            keyboardType="number-pad"
            style={{
              flex: 1,
              fontSize: 20,
              fontFamily: "Inter_600SemiBold",
              borderWidth: 0,
              textAlign: "center",
              paddingHorizontal: 8,
              color: colors.text,
              backgroundColor: colors.backgroundSecondary,
            }}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            maxLength={3}
          />
          
          <TouchableOpacity 
            onPress={incrementValue}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: colors.backgroundSecondary,
            }}
          >
            <Text style={{ fontSize: 24, color: colors.primary }}>+</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // iOS: стрелочки по сторонам с красивым отображением
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderRadius: 12,
          height: 100,
          backgroundColor: colors.backgroundSecondary,
        }}>
          <TouchableOpacity 
            onPress={decrementValue}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={{
              fontSize: 32,
              fontFamily: "Inter_700Bold",
              textAlign: "center",
              color: colors.text,
            }}>
              {inputValue}
            </Text>
            <Text style={{
              fontSize: 12,
              fontFamily: "Inter_500Medium",
              letterSpacing: 0.5,
              color: colors.textSecondary,
            }}>
              {unit}
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={incrementValue}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={{ paddingHorizontal: 4, paddingVertical: 8 }}>
        <Text style={{
          fontSize: 12,
          fontFamily: "Inter_400Regular",
          textAlign: "center",
          color: colors.textSecondary,
        }}>
          Диапазон: {min} - {max} {unit}
        </Text>
      </View>
    </View>
  );
});

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface OnboardingData {
  gender?: "male" | "female";
  height?: number;
  weight?: number;
  birth_date?: string;
  workout_frequency?: "0-2" | "3-5" | "6+";
  goal?: "lose" | "maintain" | "gain";
  
  has_trainer?: boolean;
  barrier?: string; 
  diet_type?: "classic" | "pescatarian" | "vegetarian" | "vegan";
  motivation?: string; 
  
  target_calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fats_grams?: number;
  fiber_grams?: number;
  sugar_grams?: number;
  sodium_mg?: number;
}

function CircularProgress({
  progress,
  size = 60,
  strokeWidth = 5,
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

function CircularProgressWithIcon({
  progress,
  size = 64,
  strokeWidth = 4,
  progressColor,
  backgroundColor = "#E5E5E5",
  iconName,
  iconColor = "#666666",
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  progressColor: string;
  backgroundColor?: string;
  iconName: string;
  iconColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        {progress > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      {/* Icon in center */}
      <Ionicons name={iconName as any} size={24} color={iconColor} />
    </View>
  );
}

function GoalListItem({
  iconName,
  label,
  value,
  progressColor,
  iconColor,
  onPress,
  colors,
  isDark,
}: {
  iconName: string;
  label: string;
  value: number;
  progressColor: string;
  iconColor: string;
  onPress: () => void;
  colors: any;
  isDark: boolean;
}) {
  const cardBg = isDark ? colors.card : "#FFFFFF";
  const iconBg = isDark ? colors.background : "#FFFFF0";
  const labelColor = isDark ? colors.textSecondary : "#9b9b9b";
  const valueColor = colors.text;
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";

  return (
    <View style={styles.goalItemContainer}>
      {/* Icon Circle */}
      <View style={styles.goalIconWrapper}>
        <Svg width={64} height={64} style={{ position: "absolute" }}>
          <Circle
            cx={32}
            cy={32}
            r={30}
            stroke={progressColor}
            strokeWidth={4}
            fill="none"
          />
        </Svg>
        <View style={[styles.goalIconBackground, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName as any} size={18} color={iconColor} />
        </View>
      </View>
      
      {/* Card */}
      <TouchableOpacity
        style={[styles.goalCardNew, { backgroundColor: cardBg, borderColor }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.goalCardContentNew}>
          <Text style={[styles.goalListItemLabelNew, { color: labelColor }]}>{label}</Text>
          <Text style={[styles.goalListItemValueNew, { color: valueColor }]}>{value}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function MicroCard({
  iconName,
  label,
  value,
  unit,
  iconColor,
  onEdit,
  isDark,
  colors,
  isLast = false,
}: {
  iconName: string;
  label: string;
  value: number;
  unit: string;
  iconColor: string;
  onEdit: () => void;
  isDark: boolean;
  colors: any;
  isLast?: boolean;
}) {
  // Convert hex to rgba for translucent background
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(100).springify()}
      style={[
        styles.microCard,
        { 
          backgroundColor: isDark ? "#1C1C1E" : "#FFFFF0",
        },
      ]}
    >
      <View style={[styles.microIconContainer, { backgroundColor: hexToRgba(iconColor, 0.15) }]}>
        <Ionicons name={iconName as any} size={18} color={iconColor} />
      </View>
      
      <View style={styles.microContent}>
        <Text style={[styles.microLabel, { color: colors.text }]}>{label}</Text>
        <View style={styles.microValueRow}>
          <Text style={[styles.microValue, { color: colors.text }]}>{value}</Text>
          <Text style={[styles.microUnit, { color: colors.textSecondary }]}>{unit}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.microEditButton} 
        onPress={onEdit}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
      
      {!isLast && (
        <View style={[styles.microSeparator, { backgroundColor: isDark ? "#333333" : "#E5E5E5" }]} />
      )}
    </Animated.View>
  );
}

function EditGoalModal({
  visible,
  label,
  value,
  unit,
  onClose,
  onSave,
  isDark,
  colors,
}: {
  visible: boolean;
  label: string;
  value: number;
  unit: string;
  onClose: () => void;
  onSave: (value: number) => void;
  isDark: boolean;
  colors: any;
}) {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    if (visible) {
      setInputValue(value.toString());
    }
  }, [visible, value]);

  if (!visible) return null;

  const handleSave = () => {
    const num = parseInt(inputValue, 10);
    if (!isNaN(num) && num > 0) {
      onSave(num);
      onClose();
    } else {
      Alert.alert("Ошибка", "Введите корректное значение");
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[styles.modalOverlay]}
    >
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View
        entering={FadeInDown.springify()}
        style={[styles.modalContent, { backgroundColor: isDark ? colors.card : "#FFFFF0" }]}
      >
        <Text style={[styles.modalTitle, { color: colors.text }]}>{label}</Text>
        <View style={[styles.pickerContainer]}>
          <NumericInput
            value={inputValue}
            onChangeValue={setInputValue}
            unit={unit}
            min={1}
            max={1000}
            step={1}
            colors={colors}
          />
        </View>
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: colors.fillSecondary }]}
            onPress={onClose}
          >
            <Text style={[styles.modalButtonText, { color: colors.text }]}>Отмена</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: colors.fillSecondary }]}
            onPress={handleSave}
          >
            <Text style={[styles.modalButtonText, { color: colors.text }]}>Сохранить</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

type AutoGenerateStep = "goal" | "workout" | "measurements" | "result";

function AutoGenerateFlow({
  visible,
  onClose,
  onComplete,
  initialData,
  isDark,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onComplete: (goals: NutritionGoals) => void;
  initialData: OnboardingData | null;
  isDark: boolean;
  colors: any;
}) {
  const [step, setStep] = useState<AutoGenerateStep>("goal");
  const [goal, setGoal] = useState<"lose" | "maintain" | "gain">(initialData?.goal || "maintain");
  const [workout, setWorkout] = useState<"0-2" | "3-5" | "6+">(initialData?.workout_frequency || "3-5");
  const [height, setHeight] = useState(initialData?.height?.toString() || "175");
  const [weight, setWeight] = useState(initialData?.weight?.toString() || "70");
  const [calculatedGoals, setCalculatedGoals] = useState<NutritionGoals | null>(null);

  const progress = useSharedValue(0);

  const steps: AutoGenerateStep[] = ["goal", "workout", "measurements", "result"];
  const currentStepIndex = steps.indexOf(step);

  useEffect(() => {
    progress.value = withTiming((currentStepIndex + 1) / steps.length, { duration: 300 });
  }, [step]);

  const handleNext = () => {
    hapticMedium();
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    hapticLight();
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    } else {
      onClose();
    }
  };

  const calculateGoals = useCallback(() => {
    const h = parseInt(height, 10) || 175;
    const w = parseInt(weight, 10) || 70;

    const age = initialData?.birth_date
      ? new Date().getFullYear() - new Date(initialData.birth_date).getFullYear()
      : 25;

    const userData: UserData = {
      gender: initialData?.gender || "male",
      age,
      height: h,
      weight: w,
      workoutFrequency: workout,
      goal,
    };

    const result = calculateCalories(userData);

    let calories = result.targetCalories;
    let protein = result.macros.protein.grams;
    let carbs = result.macros.carbs.grams;
    let fats = result.macros.fats.grams;
    let fiber = 38;
    let sugar = 50;
    let sodium = 2300;

    const dietType = initialData?.diet_type || "classic";
    
    if (dietType === "vegetarian" || dietType === "vegan") {
      protein = Math.round(protein * 1.1);
      fiber = 45;
      sodium = 2000;
    }
    
    if (dietType === "pescatarian") {
      fiber = 40;
    }
    const barrier = initialData?.barrier;
    
    if (barrier === "busy-schedule") {
      sugar = 40;
    }
    
    if (barrier === "bad-habits") {
      sugar = 35;
      sodium = 2000;
    }
    
    if (barrier === "inconsistency") {
    }

    const motivation = initialData?.motivation;
    
    if (motivation === "boost-energy") {
      const extraCarbs = Math.round(carbs * 0.05);
      carbs += extraCarbs;
      fats = Math.max(fats - Math.round(extraCarbs / 2), Math.round(fats * 0.85));
    }
    
    if (motivation === "feel-better") {
      protein = Math.round(protein * 1.05);
    }

    if (initialData?.has_trainer) {
      if (goal === "lose") {
        calories = Math.round(calories * 0.95);
      } else if (goal === "gain") {
        calories = Math.round(calories * 1.05);
      }
      protein = Math.round(protein * 1.1);
    }

    if (initialData?.gender === "female") {
      sodium = Math.min(sodium, 2000);
      protein = Math.max(protein, Math.round(w * 1.6));
    }

    const goals: NutritionGoals = {
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fats: Math.round(fats),
      fiber: Math.round(fiber),
      sugar: Math.round(sugar),
      sodium: Math.round(sodium),
    };

    setCalculatedGoals(goals);
    setStep("result");
  }, [height, weight, workout, goal, initialData]);

  const handleComplete = () => {
    if (calculatedGoals) {
      hapticSuccess();
      onComplete(calculatedGoals);
    }
  };

  if (!visible) return null;

  const progressBarWidth = `${((currentStepIndex + 1) / steps.length) * 100}%`;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[styles.autoGenerateOverlay, { backgroundColor: isDark ? colors.background : "#FFFFF0" }]}
    >
      <SafeAreaView style={styles.autoGenerateContainer} edges={["top"]}>
        {}
        <View style={styles.autoGenerateHeader}>
          <TouchableOpacity style={styles.autoGenerateBackButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.autoGenerateProgressBar, { backgroundColor: colors.fillTertiary }]}>
            <View
              style={[
                styles.autoGenerateProgressFill,
                { backgroundColor: colors.text, width: progressBarWidth as any },
              ]}
            />
          </View>
        </View>

        <ScrollView
          style={styles.autoGenerateScroll}
          contentContainerStyle={styles.autoGenerateScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {step === "goal" && (
            <Animated.View entering={FadeInDown.delay(100)} style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Какова твоя цель?</Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Это помогает нам составить план по твоему потреблению калорий.
              </Text>

              <View style={styles.optionsContainer}>
                <RadioButton
                  label="Похудеть"
                  selected={goal === "lose"}
                  onPress={() => setGoal("lose")}
                />
                <RadioButton
                  label="Поддерживать"
                  selected={goal === "maintain"}
                  onPress={() => setGoal("maintain")}
                />
                <RadioButton
                  label="Набрать вес"
                  selected={goal === "gain"}
                  onPress={() => setGoal("gain")}
                />
              </View>
            </Animated.View>
          )}

          {step === "workout" && (
            <Animated.View entering={FadeInDown.delay(100)} style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Сколько тренировок ты делаешь в неделю?
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Это будет использовано для настройки твоего индивидуального плана.
              </Text>

              <View style={styles.optionsContainer}>
                <WorkoutOption
                  dots={1}
                  title="0-2"
                  subtitle="Тренировки время от времени"
                  selected={workout === "0-2"}
                  onPress={() => setWorkout("0-2")}
                  isDark={isDark}
                  colors={colors}
                />
                <WorkoutOption
                  dots={2}
                  title="3-5"
                  subtitle="Несколько тренировок в неделю"
                  selected={workout === "3-5"}
                  onPress={() => setWorkout("3-5")}
                  isDark={isDark}
                  colors={colors}
                />
                <WorkoutOption
                  dots={3}
                  title="6+"
                  subtitle="Серьёзный спортсмен"
                  selected={workout === "6+"}
                  onPress={() => setWorkout("6+")}
                  isDark={isDark}
                  colors={colors}
                />
              </View>
            </Animated.View>
          )}

          {step === "measurements" && (
            <Animated.View entering={FadeInDown.delay(100)} style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Рост и вес</Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Это будет использовано для настройки твоего индивидуального плана.
              </Text>

              <View style={styles.measurementsContainer}>
                <Text style={[styles.measurementLabel, { color: colors.textSecondary }]}>Метрическая</Text>
                
                <View style={styles.measurementsRow}>
                  <View style={styles.measurementInput}>
                    <Text style={[styles.measurementInputLabel, { color: colors.text }]}>Рост</Text>
                    <View style={[styles.measurementInputBox, { backgroundColor: colors.inputBackground }]}>
                      <TextInput
                        style={[styles.measurementInputText, { color: colors.text }]}
                        value={height}
                        onChangeText={setHeight}
                        keyboardType="numeric"
                        placeholder="175"
                        placeholderTextColor={colors.placeholderText}
                      />
                      <Text style={[styles.measurementInputUnit, { color: colors.textSecondary }]}>cm</Text>
                    </View>
                  </View>
                  
                  <View style={styles.measurementInput}>
                    <Text style={[styles.measurementInputLabel, { color: colors.text }]}>Вес</Text>
                    <View style={[styles.measurementInputBox, { backgroundColor: colors.inputBackground }]}>
                      <TextInput
                        style={[styles.measurementInputText, { color: colors.text }]}
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="numeric"
                        placeholder="70"
                        placeholderTextColor={colors.placeholderText}
                      />
                      <Text style={[styles.measurementInputUnit, { color: colors.textSecondary }]}>kg</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {step === "result" && calculatedGoals && (
            <Animated.View entering={FadeInDown.delay(100)} style={styles.stepContainer}>
              <View style={styles.resultHeader}>
                <View style={[styles.resultCheckIcon, { backgroundColor: colors.text }]}>
                  <Ionicons name="checkmark" size={28} color={isDark ? colors.black : colors.buttonPrimaryText} />
                </View>
                <Text style={[styles.resultTitle, { color: colors.text }]}>
                  Поздравляем{"\n"}твой индивидуальный план готов!
                </Text>
                <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
                  Тебе следует{" "}
                  {goal === "lose" ? "похудеть до" : goal === "gain" ? "набрать до" : "поддерживать"}:
                </Text>
                <View style={[styles.resultWeightBadge, { backgroundColor: colors.text }]}>
                  <Text style={[styles.resultWeightText, { color: isDark ? colors.black : colors.buttonPrimaryText }]}>
                    {weight} кг
                  </Text>
                </View>
              </View>

              <View style={[styles.resultCard, { backgroundColor: isDark ? colors.card : "#FFFFF0" }]}>
                <Text style={[styles.resultCardTitle, { color: colors.text }]}>Ежедневная рекомендация</Text>
                <Text style={[styles.resultCardSubtitle, { color: colors.textSecondary }]}>
                  Ты можешь изменить это в любое время
                </Text>

                {}
                <View style={styles.resultMacrosList}>
                  <ResultMacroRow
                    icon="🔥"
                    label="Калории"
                    value={calculatedGoals.calories}
                    unit=""
                    isDark={isDark}
                    colors={colors}
                  />
                  <ResultMacroRow
                    icon="🌾"
                    label="Углеводы"
                    value={calculatedGoals.carbs}
                    unit="г"
                    isDark={isDark}
                    colors={colors}
                  />
                  <ResultMacroRow
                    icon="🥩"
                    label="Белки"
                    value={calculatedGoals.protein}
                    unit="г"
                    isDark={isDark}
                    colors={colors}
                  />
                  <ResultMacroRow
                    icon="💧"
                    label="Жиры"
                    value={calculatedGoals.fats}
                    unit="г"
                    isDark={isDark}
                    colors={colors}
                  />
                </View>

                <View style={[styles.healthScoreContainer, { backgroundColor: isDark ? colors.fillTertiary : "#F8F8F8" }]}>
                  <View style={styles.healthScoreIcon}>
                    <Text style={{ fontSize: 24 }}>💪</Text>
                  </View>
                  <View style={styles.healthScoreInfo}>
                    <Text style={[styles.healthScoreLabel, { color: colors.text }]}>Оценка здоровья</Text>
                    <View style={[styles.healthScoreBar, { backgroundColor: colors.fillTertiary }]}>
                      <View style={[styles.healthScoreFill, { width: "70%", backgroundColor: colors.success }]} />
                    </View>
                  </View>
                  <Text style={[styles.healthScoreValue, { color: colors.text }]}>7/10</Text>
                </View>
              </View>

              {}
              <View style={[styles.consideredDataCard, { backgroundColor: isDark ? colors.card : "#FFFFF0" }]}>
                <Text style={[styles.consideredDataTitle, { color: colors.text }]}>
                  Учтённые данные:
                </Text>
                <View style={styles.consideredDataList}>
                  <Text style={[styles.consideredDataItem, { color: colors.textSecondary }]}>
                    • Пол: {initialData?.gender === "male" ? "Мужской" : "Женский"}
                  </Text>
                  <Text style={[styles.consideredDataItem, { color: colors.textSecondary }]}>
                    • Рост: {height} см, Вес: {weight} кг
                  </Text>
                  <Text style={[styles.consideredDataItem, { color: colors.textSecondary }]}>
                    • Тренировки: {workout === "0-2" ? "0-2 в неделю" : workout === "3-5" ? "3-5 в неделю" : "6+ в неделю"}
                  </Text>
                  <Text style={[styles.consideredDataItem, { color: colors.textSecondary }]}>
                    • Цель: {goal === "lose" ? "Похудеть" : goal === "gain" ? "Набрать вес" : "Поддерживать"}
                  </Text>
                  {initialData?.diet_type && (
                    <Text style={[styles.consideredDataItem, { color: colors.textSecondary }]}>
                      • Диета: {
                        initialData.diet_type === "classic" ? "Классическая" :
                        initialData.diet_type === "vegetarian" ? "Вегетарианская" :
                        initialData.diet_type === "vegan" ? "Веганская" : "Пескатарианская"
                      }
                    </Text>
                  )}
                  {initialData?.barrier && (
                    <Text style={[styles.consideredDataItem, { color: colors.textSecondary }]}>
                      • Барьер: {
                        initialData.barrier === "inconsistency" ? "Непоследовательность" :
                        initialData.barrier === "bad-habits" ? "Вредные привычки" :
                        initialData.barrier === "lack-of-support" ? "Нет поддержки" :
                        initialData.barrier === "busy-schedule" ? "Занятой график" : "Нехватка идей"
                      }
                    </Text>
                  )}
                  {initialData?.has_trainer && (
                    <Text style={[styles.consideredDataItem, { color: colors.textSecondary }]}>
                      • С персональным тренером ✓
                    </Text>
                  )}
                </View>
              </View>

              <View style={[styles.tipsCard, { backgroundColor: isDark ? colors.card : "#FFFFF0" }]}>
                <Text style={[styles.tipsTitle, { color: colors.text }]}>Как достичь своих целей:</Text>
                
                <TipItem
                  icon="💪"
                  text="Используй оценки здоровья, чтобы улучшить свои привычки"
                  colors={colors}
                />
                <TipItem
                  icon="🥑"
                  text="Отслеживай питание"
                  colors={colors}
                />
                <TipItem
                  icon="🎯"
                  text="Следуй своей дневной норме калорий"
                  colors={colors}
                />
                <TipItem
                  icon="⚡"
                  text="Сбалансируй углеводы, белки и жиры"
                  colors={colors}
                />
              </View>

              <View style={styles.sourcesSection}>
                <Text style={[styles.sourcesTitle, { color: colors.textSecondary }]}>
                  План основан на следующих источниках, среди прочих рецензируемых медицинских исследований:
                </Text>
                <Text style={[styles.sourceItem, { color: colors.info }]}>• Основной обмен веществ</Text>
                <Text style={[styles.sourceItem, { color: colors.info }]}>• Подсчёт калорий — Гарвард</Text>
                <Text style={[styles.sourceItem, { color: colors.info }]}>• Международное общество спортивного питания</Text>
                <Text style={[styles.sourceItem, { color: colors.info }]}>• Национальные институты здоровья</Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {}
        <View style={[styles.autoGenerateBottom, { backgroundColor: isDark ? colors.background : "#FFFFF0" }]}>
          <TouchableOpacity
            style={[styles.autoGenerateFlowButton, { backgroundColor: colors.buttonPrimary }]}
            onPress={step === "result" ? handleComplete : step === "measurements" ? calculateGoals : handleNext}
          >
            <Text style={[styles.autoGenerateButtonText, { color: colors.buttonPrimaryText }]}>
              {step === "result" ? "Продолжить" : "Далее"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

function WorkoutOption({
  dots,
  title,
  subtitle,
  selected,
  onPress,
  isDark,
  colors,
}: {
  dots: number;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
  colors: any;
}) {
  const containerBg = selected 
    ? (isDark ? "#FFFFF0" : "#FFFFF0") 
    : (isDark ? colors.card : "#FFFFF0");
  const contentColor = selected 
    ? (isDark ? "#000000" : "#2D2A26") 
    : colors.text;
  const subtitleTextColor = selected 
    ? (isDark ? "#000000" : "#2D2A26") 
    : colors.textSecondary;

  return (
    <TouchableOpacity
      style={[
        styles.workoutOption,
        { backgroundColor: containerBg },
        !selected && { borderWidth: 1, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.workoutDots}>
        {Array.from({ length: dots }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.workoutDot,
              { backgroundColor: contentColor },
            ]}
          />
        ))}
      </View>
      <View style={styles.workoutInfo}>
        <Text style={[styles.workoutTitle, { color: contentColor }]}>
          {title}
        </Text>
        <Text style={[styles.workoutSubtitle, { color: subtitleTextColor }]}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ResultMacroRow({
  icon,
  label,
  value,
  unit,
  isDark,
  colors,
}: {
  icon: string;
  label: string;
  value: number;
  unit: string;
  isDark: boolean;
  colors: any;
}) {
  return (
    <View style={styles.resultMacroRow}>
      <View style={styles.resultMacroRowLeft}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
        <Text style={[styles.resultMacroRowLabel, { color: colors.text }]}>{label}</Text>
        <TouchableOpacity style={styles.resultMacroRowEdit}>
          <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.resultMacroRowRight}>
        <CircularProgress
          progress={0}
          size={56}
          strokeWidth={4}
          color={isDark ? colors.textSecondary : "#E0E0E0"}
          backgroundColor={isDark ? colors.fillTertiary : "#F0F0F0"}
        >
          <Text style={[styles.resultMacroRowValue, { color: colors.text }]}>
            {value}{unit}
          </Text>
        </CircularProgress>
      </View>
    </View>
  );
}

function TipItem({ icon, text, colors }: { icon: string; text: string; colors: any }) {
  return (
    <View style={styles.tipItem}>
      <View style={styles.tipIconContainer}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text style={[styles.tipText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

export default function NutritionGoalsScreen() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { settings, calculateAdjustedMacros } = useAppSettings();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goals, setGoals] = useState<NutritionGoals>({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 65,
    fiber: 38,
    sugar: 50,
    sodium: 2300,
  });
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [showMicronutrients, setShowMicronutrients] = useState(false);
  const [editingGoal, setEditingGoal] = useState<{ key: keyof NutritionGoals; label: string; unit: string } | null>(null);
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await apiService.getOnboardingData();
      setOnboardingData(data);
      setGoals({
        calories: data.target_calories || 2000,
        protein: data.protein_grams || 150,
        carbs: data.carbs_grams || 200,
        fats: data.fats_grams || 65,
        fiber: data.fiber_grams || 38,
        sugar: data.sugar_grams || 50,
        sodium: data.sodium_mg || 2300,
      });
    } catch {

    } finally {
      setLoading(false);
    }
  };

  const toggleMicronutrients = () => {
    hapticMedium();
    setShowMicronutrients(!showMicronutrients);
  };

  const handleEditGoal = (key: keyof NutritionGoals, label: string, unit: string) => {
    hapticLight();
    setEditingGoal({ key, label, unit });
  };

  const handleSaveGoal = (value: number) => {
    if (editingGoal) {
      // Если изменяются калории и включена авто-корректировка
      if (editingGoal.key === "calories" && settings.autoMacroAdjust && onboardingData) {
        const weight = onboardingData.weight || 70;
        const goal = onboardingData.goal || "maintain";
        const adjustedMacros = calculateAdjustedMacros(value, weight, goal);
        
        setGoals((prev) => ({
          ...prev,
          calories: value,
          protein: adjustedMacros.protein,
          carbs: adjustedMacros.carbs,
          fats: adjustedMacros.fats,
        }));
      } else {
      setGoals((prev) => ({ ...prev, [editingGoal.key]: value }));
      }
    }
  };

  const handleAutoGenerateComplete = (newGoals: NutritionGoals) => {
    setGoals(newGoals);
    setShowAutoGenerate(false);
  };

  const saveAllGoals = async () => {
    setSaving(true);
    try {
      await apiService.saveOnboardingData({
        ...onboardingData,
        target_calories: goals.calories,
        protein_grams: goals.protein,
        carbs_grams: goals.carbs,
        fats_grams: goals.fats,
        fiber_grams: goals.fiber,
        sugar_grams: goals.sugar,
        sodium_mg: goals.sodium,
      });
      hapticSuccess();
      dataCache.invalidateOnboarding();
      router.back();
    } catch {
      Alert.alert("Ошибка", "Не удалось сохранить цели");
    } finally {
      setSaving(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <LottieLoader size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // Background color based on theme
  const backgroundColor = isDark ? colors.background : "#FFFFF0";
  const textColor = colors.text;
  const secondaryTextColor = colors.textSecondary;
  const separatorColor = isDark ? "#38383A" : "#E5E5E5";
  const progressBgColor = isDark ? "#2C2C2E" : "#E5E5E5";
  
  // Icon colors
  const iconColorBase = isDark ? colors.text : "#0b0b0b";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={["top", "bottom"]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { backgroundColor }]}>
        <View style={[styles.backButtonRound, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.03)" }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={[styles.scrollView, { backgroundColor }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <Text style={[styles.headerTitleNew, { color: textColor, marginBottom: 24 }]}>
          Изменить цели{"\n"}по питанию
        </Text>

        <View>
        <GoalListItem
          iconName="flame"
          label="Цель по калориям"
          value={goals.calories}
          progressColor={isDark ? "#FFFFFF" : "#000000"}
          iconColor={iconColorBase}
          onPress={() => handleEditGoal("calories", "Калории", "ккал")}
          colors={colors}
          isDark={isDark}
        />
        
        <GoalListItem
          iconName="fitness"
          label="Цель по белку"
          value={goals.protein}
          progressColor={isDark ? "#FFFFFF" : "#000000"}
          iconColor={iconColorBase}
          onPress={() => handleEditGoal("protein", "Белки", "г")}
          colors={colors}
          isDark={isDark}
        />
        
        <GoalListItem
          iconName="restaurant"
          label="Цель по углеводам"
          value={goals.carbs}
          progressColor={isDark ? "#FF9500" : "#FF9500"}
          iconColor={iconColorBase}
          onPress={() => handleEditGoal("carbs", "Углеводы", "г")}
          colors={colors}
          isDark={isDark}
        />
        
        <GoalListItem
          iconName="water"
          label="Цель по жирам"
          value={goals.fats}
          progressColor={isDark ? "#007AFF" : "#007AFF"}
          iconColor={iconColorBase}
          onPress={() => handleEditGoal("fats", "Жиры", "г")}
          colors={colors}
          isDark={isDark}
        />

        <TouchableOpacity
          style={styles.micronutrientsToggle}
          onPress={toggleMicronutrients}
          activeOpacity={0.6}
        >
          <Text style={[styles.micronutrientsToggleText, { color: colors.textSecondary }]}>
            {showMicronutrients ? "Скрыть" : "Посмотреть микронутриенты"}
          </Text>
          <Animated.View
            style={{
              transform: [{ rotate: showMicronutrients ? "180deg" : "0deg" }],
            }}
          >
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </Animated.View>
        </TouchableOpacity>

        {showMicronutrients && (
          <Animated.View entering={FadeInDown.duration(300).springify()} style={{ marginTop: 12 }}>
            <GoalListItem
              iconName="leaf"
              label="Цель по клетчатке"
              value={goals.fiber}
              progressColor={isDark ? "#34C759" : "#34C759"}
              iconColor={iconColorBase}
              onPress={() => handleEditGoal("fiber", "Клетчатка", "г")}
              colors={colors}
              isDark={isDark}
            />
            
            <GoalListItem
              iconName="cube-outline"
              label="Цель по сахару"
              value={goals.sugar}
              progressColor={isDark ? "#AF52DE" : "#AF52DE"}
              iconColor={iconColorBase}
              onPress={() => handleEditGoal("sugar", "Сахар", "г")}
              colors={colors}
              isDark={isDark}
            />
            
            <GoalListItem
              iconName="water-outline"
              label="Цель по натрию"
              value={goals.sodium}
              progressColor={isDark ? "#8E8E93" : "#8E8E93"}
              iconColor={iconColorBase}
              onPress={() => handleEditGoal("sodium", "Натрий", "мг")}
              colors={colors}
              isDark={isDark}
            />
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      <View style={[styles.bottomButtonContainer, { backgroundColor }]}>
        <TouchableOpacity
          style={[styles.autoGenerateButtonNew, { 
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
          }]}
          onPress={() => {
            hapticMedium();
            setShowAutoGenerate(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="sparkles" size={16} color={colors.text} />
          <Text style={[styles.autoGenerateButtonTextNew, { color: colors.text }]}>
            Автогенерация
          </Text>
        </TouchableOpacity>
      </View>

      {}
      <EditGoalModal
        visible={editingGoal !== null}
        label={editingGoal?.label || ""}
        value={goals[editingGoal?.key || "calories"]}
        unit={editingGoal?.unit || ""}
        onClose={() => setEditingGoal(null)}
        onSave={handleSaveGoal}
        isDark={isDark}
        colors={colors}
      />

      {}
      <AutoGenerateFlow
        visible={showAutoGenerate}
        onClose={() => setShowAutoGenerate(false)}
        onComplete={handleAutoGenerateComplete}
        initialData={onboardingData}
        isDark={isDark}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 120,
  },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  goalCardContent: {
    flex: 1,
    marginLeft: 16,
  },
  goalListItemLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textTransform: "none",
  },
  goalListItemValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  goalItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  goalIconWrapper: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  goalIconBackground: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  goalCardNew: {
    flex: 1,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 17,
    paddingVertical: 13,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCardContentNew: {
    gap: 4,
  },
  goalListItemLabelNew: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  goalListItemValueNew: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 21,
  },
  headerNew: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  fixedHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButtonRound: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleNew: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    lineHeight: 24,
  },
  autoGenerateButtonNew: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 36,
    width: "100%",
  },
  autoGenerateButtonTextNew: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  micronutrientsToggle: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 0,
    marginTop: 16,
    marginBottom: 12,
  },
  micronutrientsToggleText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  micronutrientsContainer: {
    marginTop: 12,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  microCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: "relative",
  },
  microIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  microContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  microLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
    marginRight: 12,
  },
  microValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  microValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  microUnit: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    opacity: 0.6,
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  microEditButton: {
    padding: 8,
    marginLeft: 12,
  },
  microSeparator: {
    position: "absolute",
    bottom: 0,
    left: 76,
    right: 20,
    height: 1,
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 16,
    alignItems: "center",
  },
  autoGenerateButtonFixed: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 40,
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3E3E3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 52,
  },
  autoGenerateButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#111111",
  },
  bottomSpacer: {
    height: 20,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: SCREEN_WIDTH - 32,
    padding: 18,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
    textAlign: "center",
  },
  pickerContainer: {
    borderRadius: 14,
    marginBottom: 20,
    overflow: "hidden",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    paddingVertical: 12,
  },
  inputUnit: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    marginLeft: 8,
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonPrimary: {},
  modalButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  autoGenerateOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
  },
  autoGenerateContainer: {
    flex: 1,
  },
  autoGenerateHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  autoGenerateBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  autoGenerateProgressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  autoGenerateProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  autoGenerateScroll: {
    flex: 1,
  },
  autoGenerateScrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 100,
  },
  autoGenerateBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingVertical: 16,
    paddingBottom: 0,
  },
  autoGenerateFlowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 14,
  },
  stepContainer: {
    paddingTop: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    lineHeight: 28,
    marginBottom: 10,
  },
  stepSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 16,
  },
  workoutOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    gap: 16,
  },
  workoutDots: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  workoutDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  workoutSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  measurementsContainer: {
    gap: 20,
  },
  measurementLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  measurementsRow: {
    flexDirection: "row",
    gap: 16,
  },
  measurementInput: {
    flex: 1,
  },
  measurementInputLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
    textAlign: "center",
  },
  measurementInputBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  measurementInputText: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    minWidth: 60,
  },
  measurementInputUnit: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  resultHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  resultCheckIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 16,
  },
  resultSubtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 12,
  },
  resultWeightBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  resultWeightText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  resultCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  resultCardTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  resultCardSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  resultMacrosList: {
    marginBottom: 16,
  },
  resultMacroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  resultMacroRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  resultMacroRowLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  resultMacroRowEdit: {
    padding: 4,
  },
  resultMacroRowRight: {
    alignItems: "center",
  },
  resultMacroRowValue: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  healthScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  healthScoreIcon: {},
  healthScoreInfo: {
    flex: 1,
  },
  healthScoreLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  healthScoreBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  healthScoreFill: {
    height: "100%",
    borderRadius: 3,
  },
  healthScoreValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  consideredDataCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  consideredDataTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  consideredDataList: {
    gap: 6,
  },
  consideredDataItem: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
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
    backgroundColor: "rgba(0,0,0,0.04)",
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
  // Android Input styles
  androidInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 8,
    gap: 8,
    height: 56,
  },
  androidButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  androidInput: {
    flex: 1,
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    borderWidth: 0,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  // iOS Container styles
  iosContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    height: 100,
  },
  iosValueDisplay: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  iosUnitDisplay: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  rangeInfo: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  rangeText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },});