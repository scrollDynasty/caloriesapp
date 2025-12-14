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
import { colors } from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface CardsPagerProps {
  stats: {
    targetCalories: number;
    consumedCalories: number;
    remainingCalories: number;
    protein: { consumed: number; target: number };
    carbs: { consumed: number; target: number };
    fats: { consumed: number; target: number };
    water: { consumed: number; target: number };
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

// ==================== PAGE 1: Flippable Calories & Macros ====================

interface FlippableNutritionCardProps {
  stats: CardsPagerProps["stats"];
}

// Primary data (calories, protein, carbs, fats)
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

// Secondary data (fiber, sugar, sodium)
const getSecondaryData = () => ({
  macros: [
    { consumed: 0, target: 38, unit: "g", label: "Клетчатка", icon: "🍆", color: "#9B59B6" },
    { consumed: 0, target: 90, unit: "g", label: "Сахар", icon: "🍬", color: "#E91E63" },
    { consumed: 0, target: 2300, unit: "mg", label: "Натрий", icon: "🧂", color: "#FF9800" },
  ],
});

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function FlippableNutritionCard({ stats }: FlippableNutritionCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  const primaryData = getPrimaryData(stats);
  const secondaryData = getSecondaryData();

  const handleFlip = useCallback(() => {
    if (isAnimating.current) return;
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

  // Animation values for primary content
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

  // Animation values for secondary content
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
  const progressColor = progress >= 1 ? "#4CAF50" : "#C5C0B8";

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
          <View style={styles.caloriesCard}>
            <View style={styles.caloriesLeft}>
              <View style={styles.caloriesRow}>
                <Text style={styles.caloriesValue}>{Math.round(primaryData.main.consumed)}</Text>
                <Text style={styles.caloriesTarget}>/{primaryData.main.target}</Text>
              </View>
              <Text style={styles.caloriesLabel}>{primaryData.main.label}</Text>
            </View>
            <View style={styles.caloriesCircle}>
              <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  stroke="#E8E4DC"
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
                <Ionicons name="flame" size={28} color="#1A1A1A" />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Macros Row */}
        <View style={styles.macrosRow}>
          {primaryData.macros.map((macro, idx) => (
            <TouchableOpacity key={idx} style={styles.macroCardWrapper} activeOpacity={0.9} onPress={handleFlip}>
              <View style={styles.macroCard}>
                <View style={styles.macroValueRow}>
                  <Text style={styles.macroValue}>{Math.round(macro.consumed)}</Text>
                  <Text style={styles.macroTarget}>/{macro.target}g</Text>
                </View>
                <Text style={styles.macroLabel}>{macro.label} съедено</Text>
                <View style={styles.macroCircleContainer}>
                  <Svg width={SMALL_CIRCLE_SIZE} height={SMALL_CIRCLE_SIZE}>
                    <Circle
                      cx={SMALL_CIRCLE_SIZE / 2}
                      cy={SMALL_CIRCLE_SIZE / 2}
                      r={SMALL_RADIUS}
                      stroke="#E8E4DC"
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
          {secondaryData.macros.map((macro, idx) => (
            <TouchableOpacity key={idx} style={styles.macroCardWrapper} activeOpacity={0.9} onPress={handleFlip}>
              <View style={styles.macroCard}>
                <View style={styles.macroValueRow}>
                  <Text style={styles.macroValue}>{macro.consumed}</Text>
                  <Text style={styles.macroTarget}>/{macro.target}{macro.unit}</Text>
                </View>
                <Text style={styles.macroLabel}>{macro.label} съедено</Text>
                <View style={styles.macroCircleContainer}>
                  <Svg width={SMALL_CIRCLE_SIZE} height={SMALL_CIRCLE_SIZE}>
                    <Circle
                      cx={SMALL_CIRCLE_SIZE / 2}
                      cy={SMALL_CIRCLE_SIZE / 2}
                      r={SMALL_RADIUS}
                      stroke="#E8E4DC"
                      strokeWidth={SMALL_STROKE_WIDTH}
                      fill="transparent"
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

        {/* Health Score Card */}
        <TouchableOpacity activeOpacity={0.9} onPress={handleFlip}>
          <View style={styles.healthScoreCard}>
            <View style={styles.healthScoreHeader}>
              <Text style={styles.healthScoreTitle}>Оценка здоровья</Text>
              <Text style={styles.healthScoreValue}>Н/д</Text>
            </View>
            <View style={styles.healthScoreBar}>
              <View style={styles.healthScoreBarFill} />
            </View>
            <Text style={styles.healthScoreText}>
              Отмечай несколько продуктов, чтобы получить твой балл здоровья на сегодня. Твой балл отражает содержание питательных веществ и ст...
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ==================== PAGE 3: Activity & Water ====================

function AppleHealthCard() {
  return (
    <View style={styles.appleHealthCard}>
      <View style={styles.appleHealthContent}>
        <View style={styles.appleHealthIcon}>
          <Ionicons name="heart" size={24} color="#FF6B6B" />
        </View>
        <Text style={styles.appleHealthText}>Connect Apple Health to track your steps.</Text>
      </View>
    </View>
  );
}

function BurnedCaloriesCard() {
  return (
    <View style={styles.burnedCard}>
      <Text style={styles.burnedLabel}>Сожжённые калории</Text>
      <View style={styles.burnedRow}>
        <Text style={styles.burnedValue}>0</Text>
        <Text style={styles.burnedUnit}>cal</Text>
      </View>
      <View style={styles.stepsRow}>
        <Ionicons name="walk" size={18} color={colors.secondary} />
        <Text style={styles.stepsLabel}>Шаги</Text>
      </View>
      <Text style={styles.stepsValue}>0 cal</Text>
    </View>
  );
}

function WaterCard({ consumed, target, onAdd }: { consumed: number; target: number; onAdd?: () => void }) {
  return (
    <View style={styles.waterCard}>
      <View style={styles.waterIcon}>
        <Ionicons name="water" size={32} color="#4D96FF" />
      </View>
      <View style={styles.waterInfo}>
        <Text style={styles.waterLabel}>Вода</Text>
        <View style={styles.waterValueRow}>
          <Text style={styles.waterValue}>{consumed} мл</Text>
          <Ionicons name="settings-outline" size={14} color={colors.secondary} />
        </View>
      </View>
      <View style={styles.waterButtons}>
        <TouchableOpacity style={styles.waterBtn}>
          <Ionicons name="remove-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.waterBtnAdd} onPress={onAdd}>
          <Ionicons name="add" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ==================== MAIN PAGER ====================

export const CardsPager = memo(function CardsPager({ stats, onAddWater }: CardsPagerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentPage(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const pages = [
    // Page 1: Flippable Calories + Macros / Extra Macros + Health Score
    <View key="page1" style={styles.pageContainer}>
      <FlippableNutritionCard stats={stats} />
    </View>,

    // Page 2: Activity + Water (kept as separate page for swipe)
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
            style={[styles.dot, currentPage === index && styles.dotActive]}
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
    backgroundColor: "#DAD4CA",
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Flippable Container
  flippableContainer: {
    position: "relative",
    minHeight: 260,
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

  // Calories Card
  caloriesCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 28,
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
    color: colors.primary,
    lineHeight: 56,
    letterSpacing: -2,
  },
  caloriesTarget: {
    fontSize: 22,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
    letterSpacing: -0.5,
  },
  caloriesLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
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

  // Macros Row
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
    backgroundColor: colors.white,
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
    color: colors.primary,
    letterSpacing: -0.5,
  },
  macroTarget: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
  },
  macroLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
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

  // Health Score Card
  healthScoreCard: {
    backgroundColor: colors.white,
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
    color: colors.primary,
  },
  healthScoreValue: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: colors.secondary,
  },
  healthScoreBar: {
    height: 6,
    backgroundColor: "#F2EFE9",
    borderRadius: 3,
    marginBottom: 14,
  },
  healthScoreBarFill: {
    width: "30%",
    height: "100%",
    backgroundColor: "#DAD4CA",
    borderRadius: 3,
  },
  healthScoreText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
    lineHeight: 20,
  },

  // Activity Row
  activityRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  appleHealthCard: {
    flex: 1,
    backgroundColor: colors.white,
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
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  appleHealthText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
    textAlign: "center",
  },
  burnedCard: {
    flex: 1,
    backgroundColor: colors.white,
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
    color: colors.secondary,
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
    color: colors.primary,
  },
  burnedUnit: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stepsLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
  },
  stepsValue: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
    marginTop: 2,
  },

  // Water Card
  waterCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  waterIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#E8F4FD",
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
    color: colors.primary,
  },
  waterValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  waterValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
  },
  waterButtons: {
    flexDirection: "row",
    gap: 10,
  },
  waterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  waterBtnAdd: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
