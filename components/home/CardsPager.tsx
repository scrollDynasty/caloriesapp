import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useAppSettings } from "../../context/AppSettingsContext";
import { useTheme } from "../../context/ThemeContext";
import { hapticLight } from "../../utils/haptics";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface CardsPagerProps {
  stats: {
    targetCalories: number;
    consumedCalories: number;
    remainingCalories: number;
    protein: { consumed: number; target: number };
    carbs: { consumed: number; target: number };
    fats: { consumed: number; target: number };
    fiber: { consumed: number; target: number };
    sugar: { consumed: number; target: number };
    sodium: { consumed: number; target: number };
    healthScore: number | null;
    water: { consumed: number; target: number };
    burnedCalories?: number;    // Сожжённые калории (из настроек)
    rolloverCalories?: number;  // Перенесённые калории (из настроек)
  };
  onAddWater?: () => void;
}

const CIRCLE_SIZE = 100;
const STROKE_WIDTH = 6;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SMALL_CIRCLE_SIZE = 52;
const SMALL_STROKE_WIDTH = 4;
const SMALL_RADIUS = (SMALL_CIRCLE_SIZE - SMALL_STROKE_WIDTH) / 2;
const SMALL_CIRCUMFERENCE = 2 * Math.PI * SMALL_RADIUS;


interface FlippableNutritionCardProps {
  stats: CardsPagerProps["stats"];
}

const getPrimaryData = (stats: CardsPagerProps["stats"]) => ({
  main: {
    consumed: stats.consumedCalories,
    target: stats.targetCalories,
    label: "Съеденные калории",
    progress: stats.targetCalories > 0 ? Math.min(1, stats.consumedCalories / stats.targetCalories) : 0,
  },
  macros: [
    {
      consumed: stats.protein.consumed,
      target: stats.protein.target,
      label: "Белки",
      progress: stats.protein.target > 0 ? stats.protein.consumed / stats.protein.target : 0,
      color: "#FF6B6B",
      icon: "🍖",
    },
    {
      consumed: stats.carbs.consumed,
      target: stats.carbs.target,
      label: "Углеводы",
      progress: stats.carbs.target > 0 ? stats.carbs.consumed / stats.carbs.target : 0,
      color: "#FCA549",
      icon: "🌾",
    },
    {
      consumed: stats.fats.consumed,
      target: stats.fats.target,
      label: "Жиры",
      progress: stats.fats.target > 0 ? stats.fats.consumed / stats.fats.target : 0,
      color: "#4D96FF",
      icon: "🫒",
    },
  ],
});

const getSecondaryData = (stats: CardsPagerProps["stats"]) => ({
  macros: [
    { 
      consumed: stats.fiber.consumed, 
      target: stats.fiber.target, 
      unit: "g", 
      label: "Клетчатка", 
      icon: "🥦", 
      color: "#4CAF50",
      progress: stats.fiber.target > 0 ? Math.min(1, stats.fiber.consumed / stats.fiber.target) : 0,
    },
    { 
      consumed: stats.sugar.consumed, 
      target: stats.sugar.target, 
      unit: "g", 
      label: "Сахар", 
      icon: "🍬", 
      color: "#E91E63",
      progress: stats.sugar.target > 0 ? Math.min(1, stats.sugar.consumed / stats.sugar.target) : 0,
      isInverted: true, 
    },
    { 
      consumed: stats.sodium.consumed, 
      target: stats.sodium.target, 
      unit: "мг", 
      label: "Натрий", 
      icon: "🧂", 
      color: "#FF9800",
      progress: stats.sodium.target > 0 ? Math.min(1, stats.sodium.consumed / stats.sodium.target) : 0,
      isInverted: true,
    },
  ],
  healthScore: stats.healthScore,
});

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function FlippableNutritionCard({ stats }: FlippableNutritionCardProps) {
  const { colors: themeColors, isDark } = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  const primaryData = getPrimaryData(stats);
  const secondaryData = getSecondaryData(stats);

  const handleFlip = useCallback(() => {
    if (isAnimating.current) return;
    hapticLight();
    isAnimating.current = true;

    const toValue = isFlipped ? 0 : 1;

    Animated.spring(flipAnim, {
      toValue,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start(() => {
      setIsFlipped(!isFlipped);
      isAnimating.current = false;
    });
  }, [isFlipped, flipAnim]);

  const primaryOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const primaryTranslateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });

  const primaryScale = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.95, 0.9],
  });

  const secondaryOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const secondaryTranslateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0],
  });

  const secondaryScale = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.9, 0.95, 1],
  });

  const progress = primaryData.main.progress;
  const progressColor = progress >= 1 ? "#4CAF50" : (isDark ? themeColors.gray3 : "#C5C0B8");

  return (
    <View style={styles.flippableContainer}>
      {/* Primary Content (Calories + Macros) */}
      <Animated.View
        style={[
          styles.flipContent,
          {
            opacity: primaryOpacity,
            transform: [
              { translateY: primaryTranslateY },
              { scale: primaryScale },
            ],
          },
        ]}
        pointerEvents={isFlipped ? "none" : "auto"}
      >
        {/* Calories Card */}
        <TouchableOpacity activeOpacity={0.9} onPress={handleFlip}>
          <View style={[styles.caloriesCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.caloriesLeft}>
              <View style={styles.caloriesRow}>
                <Text style={[styles.caloriesValue, { color: themeColors.text }]}>{Math.round(primaryData.main.consumed)}</Text>
                <Text style={[styles.caloriesTarget, { color: themeColors.textSecondary }]}>/{primaryData.main.target}</Text>
              </View>
              <Text style={[styles.caloriesLabel, { color: themeColors.textSecondary }]}>{primaryData.main.label}</Text>
            </View>
            <View style={styles.caloriesCircle}>
              <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  stroke={isDark ? themeColors.gray4 : "#E8E4DC"}
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                />
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  stroke={progressColor}
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
                />
              </Svg>
              <View style={styles.caloriesIconCenter}>
                <Ionicons name="flame" size={28} color={themeColors.text} />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Macros Row */}
        <View style={styles.macrosRow}>
          {primaryData.macros.map((macro, idx) => (
            <TouchableOpacity key={idx} style={styles.macroCardWrapper} activeOpacity={0.9} onPress={handleFlip}>
              <View style={[styles.macroCard, { backgroundColor: themeColors.card }]}>
                <View style={styles.macroValueRow}>
                  <Text style={[styles.macroValue, { color: themeColors.text }]}>{Math.round(macro.consumed)}</Text>
                  <Text style={[styles.macroTarget, { color: themeColors.textSecondary }]}>/{macro.target}g</Text>
                </View>
                <Text style={[styles.macroLabel, { color: themeColors.textSecondary }]}>{macro.label} съедено</Text>
                <View style={styles.macroCircleContainer}>
                  <Svg width={SMALL_CIRCLE_SIZE} height={SMALL_CIRCLE_SIZE}>
                    <Circle
                      cx={SMALL_CIRCLE_SIZE / 2}
                      cy={SMALL_CIRCLE_SIZE / 2}
                      r={SMALL_RADIUS}
                      stroke={isDark ? themeColors.gray4 : "#E8E4DC"}
                      strokeWidth={SMALL_STROKE_WIDTH}
                      fill="transparent"
                    />
                    <Circle
                      cx={SMALL_CIRCLE_SIZE / 2}
                      cy={SMALL_CIRCLE_SIZE / 2}
                      r={SMALL_RADIUS}
                      stroke={macro.color}
                      strokeWidth={SMALL_STROKE_WIDTH}
                      fill="transparent"
                      strokeDasharray={SMALL_CIRCUMFERENCE}
                      strokeDashoffset={SMALL_CIRCUMFERENCE * (1 - Math.min(1, macro.progress))}
                      strokeLinecap="round"
                      rotation="-90"
                      origin={`${SMALL_CIRCLE_SIZE / 2}, ${SMALL_CIRCLE_SIZE / 2}`}
                    />
                  </Svg>
                  <View style={styles.macroIconCenter}>
                    <Text style={styles.macroIcon}>{macro.icon}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Secondary Content (Fiber, Sugar, Sodium + Health Score) */}
      <Animated.View
        style={[
          styles.flipContent,
          styles.flipContentAbsolute,
          {
            opacity: secondaryOpacity,
            transform: [
              { translateY: secondaryTranslateY },
              { scale: secondaryScale },
            ],
          },
        ]}
        pointerEvents={isFlipped ? "auto" : "none"}
      >
        {/* Extra Macros Row */}
        <View style={styles.extraMacrosRow}>
          {secondaryData.macros.map((macro, idx) => {
            const progressColor = macro.isInverted 
              ? (macro.progress > 0.8 ? "#E91E63" : macro.progress > 0.5 ? "#FF9800" : "#4CAF50")
              : macro.color;
            return (
              <TouchableOpacity key={idx} style={styles.macroCardWrapper} activeOpacity={0.9} onPress={handleFlip}>
                <View style={[styles.macroCard, { backgroundColor: themeColors.card }]}>
                  <View style={styles.macroValueRow}>
                    <Text style={[styles.macroValue, { color: themeColors.text }]}>{Math.round(macro.consumed)}</Text>
                    <Text style={[styles.macroTarget, { color: themeColors.textSecondary }]}>/{macro.target}{macro.unit}</Text>
                  </View>
                  <Text style={[styles.macroLabel, { color: themeColors.textSecondary }]}>{macro.label}</Text>
                  <View style={styles.macroCircleContainer}>
                    <Svg width={SMALL_CIRCLE_SIZE} height={SMALL_CIRCLE_SIZE}>
                      <Circle
                        cx={SMALL_CIRCLE_SIZE / 2}
                        cy={SMALL_CIRCLE_SIZE / 2}
                        r={SMALL_RADIUS}
                        stroke={isDark ? themeColors.gray4 : "#E8E4DC"}
                        strokeWidth={SMALL_STROKE_WIDTH}
                        fill="transparent"
                      />
                      <Circle
                        cx={SMALL_CIRCLE_SIZE / 2}
                        cy={SMALL_CIRCLE_SIZE / 2}
                        r={SMALL_RADIUS}
                        stroke={progressColor}
                        strokeWidth={SMALL_STROKE_WIDTH}
                        fill="transparent"
                        strokeDasharray={SMALL_CIRCUMFERENCE}
                        strokeDashoffset={SMALL_CIRCUMFERENCE * (1 - Math.min(1, macro.progress))}
                        strokeLinecap="round"
                        rotation="-90"
                        origin={`${SMALL_CIRCLE_SIZE / 2}, ${SMALL_CIRCLE_SIZE / 2}`}
                      />
                    </Svg>
                    <View style={styles.macroIconCenter}>
                      <Text style={styles.macroIcon}>{macro.icon}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity activeOpacity={0.9} onPress={handleFlip}>
          <View style={[styles.healthScoreCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.healthScoreHeader}>
              <Text style={[styles.healthScoreTitle, { color: themeColors.text }]}>Оценка здоровья</Text>
              <Text style={[
                styles.healthScoreValue,
                { color: secondaryData.healthScore !== null 
                  ? (secondaryData.healthScore >= 7 ? "#4CAF50" 
                     : secondaryData.healthScore >= 4 ? "#FF9800" 
                     : "#E91E63")
                  : themeColors.textSecondary
                }
              ]}>
                {secondaryData.healthScore !== null ? `${secondaryData.healthScore}/10` : "—"}
              </Text>
            </View>
            <View style={[styles.healthScoreBar, { backgroundColor: isDark ? themeColors.gray5 : "#F2EFE9" }]}>
              <View style={[
                styles.healthScoreBarFill, 
                { 
                  width: secondaryData.healthScore !== null ? `${secondaryData.healthScore * 10}%` : "0%",
                  backgroundColor: secondaryData.healthScore !== null 
                    ? (secondaryData.healthScore >= 7 ? "#4CAF50" 
                       : secondaryData.healthScore >= 4 ? "#FF9800" 
                       : "#E91E63")
                    : (isDark ? themeColors.gray4 : "#DAD4CA")
                }
              ]} />
            </View>
            <Text style={[styles.healthScoreText, { color: themeColors.textSecondary }]}>
              {secondaryData.healthScore !== null 
                ? (secondaryData.healthScore >= 7 
                    ? "Отличный баланс питательных веществ! Продолжай в том же духе 💪"
                    : secondaryData.healthScore >= 4 
                    ? "Неплохо! Добавь больше клетчатки и уменьши сахар для улучшения"
                    : "Попробуй добавить больше овощей и снизить потребление сахара")
                : "Добавь блюда, чтобы получить оценку здоровья за день"}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function AppleHealthCard() {
  const { colors: themeColors, isDark } = useTheme();
  const { settings, rolloverCalories, featureStatus, burnedCalories, requestHealthPermission } = useAppSettings();
  
  // Показываем перенос калорий, если включён и есть данные
  if (settings.calorieRollover && rolloverCalories && rolloverCalories.amount > 0) {
    return (
      <View style={[styles.appleHealthCard, { backgroundColor: themeColors.card }]}>
        <View style={styles.appleHealthContent}>
          <View style={[styles.appleHealthIcon, { backgroundColor: isDark ? themeColors.gray5 : "#E8F5E9" }]}>
            <Ionicons name="arrow-forward-circle" size={24} color="#4CAF50" />
          </View>
          <Text style={[styles.rolloverTitle, { color: themeColors.text }]}>Перенос калорий</Text>
          <Text style={[styles.rolloverValue, { color: "#4CAF50" }]}>+{rolloverCalories.amount}</Text>
          <Text style={[styles.appleHealthText, { color: themeColors.textSecondary }]}>
            С {rolloverCalories.fromDate}
          </Text>
        </View>
      </View>
    );
  }
  
  // Показываем данные Health если подключено
  if (featureStatus.healthAuthorized && burnedCalories) {
    return (
      <View style={[styles.appleHealthCard, { backgroundColor: themeColors.card }]}>
        <View style={styles.appleHealthContent}>
          <View style={[styles.appleHealthIcon, { backgroundColor: isDark ? themeColors.gray5 : "#E8F5E9" }]}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
          </View>
          <View style={styles.healthConnectedInfo}>
            <Text style={[styles.healthConnectedTitle, { color: themeColors.text }]}>Health подключён</Text>
            <View style={styles.healthStatsRow}>
              <View style={styles.healthStatItem}>
                <Ionicons name="walk" size={14} color="#007AFF" />
                <Text style={[styles.healthStatValue, { color: themeColors.text }]}>
                  {burnedCalories.steps.toLocaleString()}
                </Text>
              </View>
              <View style={styles.healthStatItem}>
                <Ionicons name="flame" size={14} color="#FF9500" />
                <Text style={[styles.healthStatValue, { color: themeColors.text }]}>
                  {burnedCalories.activeCalories}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
  
  // Показываем кнопку подключения
  return (
    <TouchableOpacity
      style={[styles.appleHealthCard, { backgroundColor: themeColors.card }]}
      onPress={() => {
        hapticLight();
        requestHealthPermission();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.appleHealthContent}>
        <View style={[styles.appleHealthIcon, { backgroundColor: isDark ? themeColors.gray5 : "#FFF0F0" }]}>
          <Ionicons name="heart" size={24} color="#FF6B6B" />
        </View>
        <Text style={[styles.appleHealthText, { color: themeColors.textSecondary }]}>
          Нажмите чтобы подключить Health
        </Text>
        <Ionicons name="chevron-forward" size={16} color={themeColors.textTertiary} style={styles.healthArrow} />
      </View>
    </TouchableOpacity>
  );
}

function BurnedCaloriesCard() {
  const { colors: themeColors, isDark } = useTheme();
  const { settings, burnedCalories } = useAppSettings();
  
  const activeCalories = settings.burnedCalories && burnedCalories 
    ? burnedCalories.activeCalories 
    : 0;
  const steps = settings.burnedCalories && burnedCalories 
    ? burnedCalories.steps 
    : 0;
  const stepsCalories = Math.round(steps * 0.04); // Примерно 0.04 кал на шаг
  
  return (
    <View style={[styles.burnedCard, { backgroundColor: themeColors.card }]}>
      <Text style={[styles.burnedLabel, { color: themeColors.textSecondary }]}>Сожжённые калории</Text>
      <View style={styles.burnedRow}>
        <Text style={[styles.burnedValue, { color: activeCalories > 0 ? themeColors.warning : themeColors.text }]}>
          {activeCalories}
        </Text>
        <Text style={[styles.burnedUnit, { color: themeColors.textSecondary }]}>ккал</Text>
      </View>
      <View style={styles.stepsRow}>
        <Ionicons name="walk" size={18} color={themeColors.textSecondary} />
        <Text style={[styles.stepsLabel, { color: themeColors.text }]}>{steps.toLocaleString()} шаги</Text>
      </View>
      <Text style={[styles.stepsValue, { color: themeColors.textSecondary }]}>~{stepsCalories} ккал</Text>
      
      {!settings.burnedCalories && (
        <View style={[styles.burnedDisabledOverlay, { backgroundColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)" }]}>
          <Text style={[styles.burnedDisabledText, { color: themeColors.textSecondary }]}>
            Включите в настройках
          </Text>
        </View>
      )}
    </View>
  );
}

function WaterCard({ consumed, target, onAdd }: { consumed: number; target: number; onAdd?: () => void }) {
  const { colors: themeColors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.waterCard,
        {
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
          shadowOpacity: isDark ? 0 : 0.03,
          elevation: isDark ? 0 : 1,
        },
      ]}
    > 
      <View style={[styles.waterIcon, { backgroundColor: isDark ? themeColors.backgroundSecondary : "#E8F4FD" }]}> 
        <Ionicons name="water" size={32} color={themeColors.primary} />
      </View>
      <View style={styles.waterInfo}>
        <Text style={[styles.waterLabel, { color: themeColors.text }]}>Вода</Text>
        <View style={styles.waterValueRow}>
          <Text style={[styles.waterValue, { color: themeColors.textSecondary }]}>{consumed} мл</Text>
          <Ionicons name="settings-outline" size={14} color={themeColors.textSecondary} />
        </View>
      </View>
      <View style={styles.waterButtons}>
        <TouchableOpacity
          style={[styles.waterBtn, { backgroundColor: themeColors.backgroundSecondary, borderColor: themeColors.border }]}
        > 
          <Ionicons name="remove-outline" size={20} color={themeColors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.waterBtnAdd, { backgroundColor: themeColors.primary, borderColor: themeColors.primary }]}
          onPress={onAdd}
        > 
          <Ionicons name="add" size={20} color={themeColors.buttonPrimaryText} />
        </TouchableOpacity>
      </View>
    </View>
  );
}


export const CardsPager = memo(function CardsPager({ stats, onAddWater }: CardsPagerProps) {
  const { colors: themeColors } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentPage(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const pages = [
    <View key="page1" style={styles.pageContainer}>
      <FlippableNutritionCard stats={stats} />
    </View>,

    <View key="page2" style={styles.pageContainer}>
      <View style={styles.activityRow}>
        <AppleHealthCard />
        <BurnedCaloriesCard />
      </View>
      <WaterCard consumed={stats.water.consumed} target={stats.water.target} onAdd={onAddWater} />
    </View>,
  ];

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => `page-${index}`}
        renderItem={({ item }) => (
          <View style={[styles.pageWrapper, { width: SCREEN_WIDTH }]}>
            {item}
          </View>
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
      <View style={styles.pagination}>
        {pages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot, 
              { backgroundColor: currentPage === index ? themeColors.primary : themeColors.gray4 },
              currentPage === index && styles.dotActive
            ]}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  pageWrapper: {
    paddingHorizontal: 0,
  },
  pageContainer: {
    paddingHorizontal: 0,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  flippableContainer: {
    position: "relative",
    minHeight: 300,
  },
  flipContent: {
    width: "100%",
  },
  flipContentAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },

  caloriesCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  caloriesLeft: {
    gap: 4,
  },
  caloriesRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  caloriesValue: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    lineHeight: 56,
    letterSpacing: -2,
  },
  caloriesTarget: {
    fontSize: 22,
    fontFamily: "Inter_500Medium",
    letterSpacing: -0.5,
  },
  caloriesLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    letterSpacing: -0.2,
  },
  caloriesCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  caloriesIconCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    gap: 10,
  },
  extraMacrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  macroCardWrapper: {
    flex: 1,
  },
  macroCard: {
    padding: 14,
    borderRadius: 18,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  macroValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  macroValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  macroTarget: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  macroLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
    marginBottom: 12,
  },
  macroCircleContainer: {
    width: SMALL_CIRCLE_SIZE,
    height: SMALL_CIRCLE_SIZE,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  macroIconCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  macroIcon: {
    fontSize: 16,
  },

  healthScoreCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  healthScoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  healthScoreTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  healthScoreValue: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  healthScoreBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 14,
  },
  healthScoreBarFill: {
    width: "30%",
    height: "100%",
    borderRadius: 3,
  },
  healthScoreText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },

  activityRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  appleHealthCard: {
    flex: 1,
    padding: 20,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    minHeight: 140,
  },
  appleHealthContent: {
    alignItems: "center",
    gap: 12,
  },
  appleHealthIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  appleHealthText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  healthConnectedInfo: {
    alignItems: "center",
    gap: 4,
  },
  healthConnectedTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  healthStatsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  healthStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  healthStatValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  healthArrow: {
    marginTop: 4,
  },
  burnedCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  burnedLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  burnedRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 12,
  },
  burnedValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  burnedUnit: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stepsLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  stepsValue: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  burnedDisabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  burnedDisabledText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  rolloverTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
  },
  rolloverValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },

  waterCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  waterIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  waterInfo: {
    flex: 1,
  },
  waterLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  waterValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  waterValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  waterButtons: {
    flexDirection: "row",
    gap: 10,
  },
  waterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  waterBtnAdd: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
