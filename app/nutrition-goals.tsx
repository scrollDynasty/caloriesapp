import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { RadioButton } from "../components/ui/RadioButton";
import { useTheme } from "../context/ThemeContext";
import { useFonts } from "../hooks/use-fonts";
import { apiService } from "../services/api";
import { dataCache } from "../stores/dataCache";
import { UserData, calculateCalories } from "../utils/calorieCalculator";
import { hapticLight, hapticMedium, hapticSuccess } from "../utils/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

function GoalCard({
  icon,
  label,
  value,
  unit,
  color,
  onEdit,
  isDark,
  colors,
}: {
  icon: string;
  label: string;
  value: number;
  unit: string;
  color: string;
  onEdit: () => void;
  isDark: boolean;
  colors: any;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    hapticLight();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onEdit}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.goalCard,
          { backgroundColor: isDark ? colors.card : "#FFFFF0" },
          animatedStyle,
        ]}
      >
        <View style={styles.goalCardHeader}>
          <View style={[styles.goalIconContainer, { backgroundColor: `${color}15` }]}>
            <Text style={styles.goalIcon}>{icon}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Ionicons name="pencil" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>{label}</Text>
        <View style={styles.goalValueContainer}>
          <CircularProgress
            progress={0}
            size={52}
            strokeWidth={4}
            color={color}
            backgroundColor={isDark ? colors.fillTertiary : "#F0F0F0"}
          >
            <Text style={[styles.goalValue, { color: colors.text }]}>{value}</Text>
          </CircularProgress>
          <Text style={[styles.goalUnit, { color: colors.textSecondary }]}>{unit}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function MicroCard({
  icon,
  label,
  value,
  unit,
  color,
  onEdit,
  isDark,
  colors,
}: {
  icon: string;
  label: string;
  value: number;
  unit: string;
  color: string;
  onEdit: () => void;
  isDark: boolean;
  colors: any;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(100).springify()}
      style={[
        styles.microCard,
        { backgroundColor: isDark ? colors.card : "#FFFFF0" },
      ]}
    >
      <View style={[styles.microIconContainer, { backgroundColor: `${color}15` }]}>
        <Text style={styles.microIcon}>{icon}</Text>
      </View>
      <View style={styles.microInfo}>
        <Text style={[styles.microLabel, { color: colors.textSecondary }]}>{label}</Text>
        <View style={styles.microValueRow}>
          <Text style={[styles.microValue, { color: colors.text }]}>{value}</Text>
          <Text style={[styles.microUnit, { color: colors.textSecondary }]}>{unit}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.microEditButton} onPress={onEdit}>
        <Ionicons name="pencil" size={14} color={colors.textSecondary} />
      </TouchableOpacity>
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
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setInputValue(value.toString());
      setTimeout(() => inputRef.current?.focus(), 100);
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
        <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text }]}
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType="numeric"
            selectTextOnFocus
          />
          <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>{unit}</Text>
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
      setGoals((prev) => ({ ...prev, [editingGoal.key]: value }));
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
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Цели питания</Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveAllGoals}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.accent }]}>Сохранить</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ОСНОВНЫЕ ЦЕЛИ</Text>
          <View style={styles.goalsGrid}>
            <GoalCard
              icon="🔥"
              label="Калории"
              value={goals.calories}
              unit="ккал"
              color="#FF6B6B"
              onEdit={() => handleEditGoal("calories", "Калории", "ккал")}
              isDark={isDark}
              colors={colors}
            />
            <GoalCard
              icon="🥩"
              label="Белки"
              value={goals.protein}
              unit="г"
              color="#FF6B6B"
              onEdit={() => handleEditGoal("protein", "Белки", "г")}
              isDark={isDark}
              colors={colors}
            />
            <GoalCard
              icon="🌾"
              label="Углеводы"
              value={goals.carbs}
              unit="г"
              color="#FFB347"
              onEdit={() => handleEditGoal("carbs", "Углеводы", "г")}
              isDark={isDark}
              colors={colors}
            />
            <GoalCard
              icon="💧"
              label="Жиры"
              value={goals.fats}
              unit="г"
              color="#4D96FF"
              onEdit={() => handleEditGoal("fats", "Жиры", "г")}
              isDark={isDark}
              colors={colors}
            />
          </View>
        </View>

        {}
        <TouchableOpacity
          style={[styles.micronutrientsToggle, { backgroundColor: isDark ? colors.card : "#FFFFF0" }]}
          onPress={toggleMicronutrients}
          activeOpacity={0.7}
        >
          <View style={styles.micronutrientsToggleContent}>
            <Text style={{ fontSize: 18 }}>🥗</Text>
            <Text style={[styles.micronutrientsToggleText, { color: colors.text }]}>
              Посмотреть микронутриенты
            </Text>
          </View>
          <Animated.View
            style={{
              transform: [{ rotate: showMicronutrients ? "180deg" : "0deg" }],
            }}
          >
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </Animated.View>
        </TouchableOpacity>

        {}
        {showMicronutrients && (
          <View style={styles.micronutrientsContainer}>
            <MicroCard
              icon="🌿"
              label="Клетчатка"
              value={goals.fiber}
              unit="г"
              color="#4CAF50"
              onEdit={() => handleEditGoal("fiber", "Клетчатка", "г")}
              isDark={isDark}
              colors={colors}
            />
            <MicroCard
              icon="🍬"
              label="Сахар"
              value={goals.sugar}
              unit="г"
              color="#FF9800"
              onEdit={() => handleEditGoal("sugar", "Сахар", "г")}
              isDark={isDark}
              colors={colors}
            />
            <MicroCard
              icon="🧂"
              label="Натрий"
              value={goals.sodium}
              unit="мг"
              color="#9C27B0"
              onEdit={() => handleEditGoal("sodium", "Натрий", "мг")}
              isDark={isDark}
              colors={colors}
            />
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {}
      <View style={[styles.bottomButtonContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.autoGenerateButtonFixed, { backgroundColor: colors.buttonPrimary }]}
          onPress={() => {
            hapticMedium();
            setShowAutoGenerate(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="sparkles" size={20} color={colors.buttonPrimaryText} />
          <Text style={[styles.autoGenerateButtonText, { color: colors.buttonPrimaryText }]}>
            Автогенерация целей
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  goalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  goalCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  goalCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  goalIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  goalIcon: {
    fontSize: 18,
  },
  editButton: {
    padding: 6,
  },
  goalLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  goalValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  goalValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  goalUnit: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  micronutrientsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  micronutrientsToggleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  micronutrientsToggleText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  micronutrientsContainer: {
    marginTop: 12,
    gap: 10,
    marginBottom: 10,
  },
  microCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  microIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  microIcon: {
    fontSize: 18,
  },
  microInfo: {
    flex: 1,
    marginLeft: 14,
  },
  microLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  microValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  microValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  microUnit: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  microEditButton: {
    padding: 8,
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
  },
  autoGenerateButtonFixed: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 16,
    gap: 10,
  },
  autoGenerateButtonText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  bottomSpacer: {
    height: 100,
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
    width: SCREEN_WIDTH - 48,
    padding: 24,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
    textAlign: "center",
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
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  autoGenerateBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  autoGenerateFlowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 16,
  },
  stepContainer: {
    paddingTop: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    lineHeight: 34,
    marginBottom: 12,
  },
  stepSubtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    marginBottom: 32,
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
});

