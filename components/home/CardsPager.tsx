import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken
} from "react-native";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useAppSettings } from "../../context/AppSettingsContext";
import { useLanguage } from "../../context/LanguageContext";
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
    burnedCalories?: number;
    rolloverCalories?: number;
  };
  onAddWater?: () => void;
}

const CIRCLE_SIZE = Platform.OS === "ios" ? 110 : 100;
const STROKE_WIDTH = Platform.OS === "ios" ? 7 : 6;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SMALL_CIRCLE_SIZE = Platform.OS === "ios" ? 48 : 44;
const SMALL_STROKE_WIDTH = Platform.OS === "ios" ? 4 : 3;
const SMALL_RADIUS = (SMALL_CIRCLE_SIZE - SMALL_STROKE_WIDTH) / 2;
const SMALL_CIRCUMFERENCE = 2 * Math.PI * SMALL_RADIUS;


interface FlippableNutritionCardProps {
  stats: CardsPagerProps["stats"];
}

const getPrimaryData = (stats: CardsPagerProps["stats"], t: (key: string) => string) => ({
  main: {
    consumed: stats.consumedCalories,
    target: stats.targetCalories,
    label: t('nutrition.caloriesConsumed'),
    progress: stats.targetCalories > 0 ? Math.min(1, stats.consumedCalories / stats.targetCalories) : 0,
  },
  macros: [
    {
      consumed: stats.protein.consumed,
      target: stats.protein.target,
      label: t('nutrition.protein'),
      progress: stats.protein.target > 0 ? stats.protein.consumed / stats.protein.target : 0,
      color: "#FF6B6B",
      icon: "🍖",
    },
    {
      consumed: stats.carbs.consumed,
      target: stats.carbs.target,
      label: t('nutrition.carbs'),
      progress: stats.carbs.target > 0 ? stats.carbs.consumed / stats.carbs.target : 0,
      color: "#FCA549",
      icon: "🌾",
    },
    {
      consumed: stats.fats.consumed,
      target: stats.fats.target,
      label: t('nutrition.fats'),
      progress: stats.fats.target > 0 ? stats.fats.consumed / stats.fats.target : 0,
      color: "#4D96FF",
      icon: "🫒",
    },
  ],
});

const getSecondaryData = (stats: CardsPagerProps["stats"], t: (key: string) => string) => ({
  macros: [
    { 
      consumed: stats.fiber.consumed, 
      target: stats.fiber.target, 
      unit: "g", 
      label: t('nutrition.fiber'), 
      icon: "🥦", 
      color: "#4CAF50",
      progress: stats.fiber.target > 0 ? Math.min(1, stats.fiber.consumed / stats.fiber.target) : 0,
    },
    { 
      consumed: stats.sugar.consumed, 
      target: stats.sugar.target, 
      unit: "g", 
      label: t('nutrition.sugar'), 
      icon: "🍬", 
      color: "#E91E63",
      progress: stats.sugar.target > 0 ? Math.min(1, stats.sugar.consumed / stats.sugar.target) : 0,
      isInverted: true, 
    },
    { 
      consumed: stats.sodium.consumed, 
      target: stats.sodium.target, 
      unit: t('units.mg'), 
      label: t('nutrition.sodium'), 
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
  const { t } = useLanguage();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const flipAnim = useSharedValue(0);

  const primaryData = useMemo(() => getPrimaryData(stats, t), [stats, t]);
  const secondaryData = useMemo(() => getSecondaryData(stats, t), [stats, t]);

  const finishFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
    setIsAnimating(false);
  }, [isFlipped]);

  const handleFlip = useCallback(() => {
    if (isAnimating) return;
    hapticLight();
    setIsAnimating(true);

    const toValue = isFlipped ? 0 : 1;

    flipAnim.value = withTiming(toValue, {
      duration: 300,
    }, () => {
      runOnJS(finishFlip)();
    });
  }, [isFlipped, flipAnim, finishFlip, isAnimating]);

  const primaryAnimatedStyle = useAnimatedStyle(() => {
    const progress = flipAnim.value;
    return {
      opacity: 1 - progress,
      transform: [
        { scale: 1 - progress * 0.05 },
      ],
    };
  });

  const secondaryAnimatedStyle = useAnimatedStyle(() => {
    const progress = flipAnim.value;
    return {
      opacity: progress,
      transform: [
        { scale: 0.95 + progress * 0.05 },
      ],
    };
  });

  const progress = primaryData.main.progress;
  const progressColor = progress >= 1 ? "#4CAF50" : (isDark ? themeColors.gray3 : "#C5C0B8");

  return (
    <View style={styles.flippableContainer}>
      <Animated.View
        style={[
          styles.flipContent,
          {
            ...primaryAnimatedStyle,
          },
        ]}
        pointerEvents={isFlipped ? "none" : "auto"}
      >
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={handleFlip}
          disabled={isAnimating}
        >
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
                <Ionicons name="flame" size={Platform.OS === "ios" ? 32 : 28} color={themeColors.text} />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.macrosRow}>
          {primaryData.macros.map((macro, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.macroCardWrapper} 
              activeOpacity={0.9} 
              onPress={handleFlip}
              disabled={isAnimating}
            >
              <View style={[styles.macroCard, { backgroundColor: themeColors.card }]}>
                <View style={styles.macroValueRow}>
                  <Text style={[styles.macroValue, { color: themeColors.text }]}>{Math.round(macro.consumed)}</Text>
                  <Text style={[styles.macroTarget, { color: themeColors.textSecondary }]}>/{macro.target}g</Text>
                </View>
                <Text style={[styles.macroLabel, { color: themeColors.textSecondary }]}>{macro.label} {t('nutrition.consumed')}</Text>
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

      <Animated.View
        style={[
          styles.flipContent,
          styles.flipContentAbsolute,
          {
            ...secondaryAnimatedStyle,
          },
        ]}
        pointerEvents={isFlipped ? "auto" : "none"}
      >
        <View style={styles.extraMacrosRow}>
          {secondaryData.macros.map((macro, idx) => {
            const progressColor = macro.isInverted 
              ? (macro.progress > 0.8 ? "#E91E63" : macro.progress > 0.5 ? "#FF9800" : "#4CAF50")
              : macro.color;
            return (
              <TouchableOpacity 
                key={idx} 
                style={styles.macroCardWrapper} 
                activeOpacity={0.9} 
                onPress={handleFlip}
                disabled={isAnimating}
              >
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

        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={handleFlip}
          disabled={isAnimating}
        >
          <View style={[styles.healthScoreCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.healthScoreHeader}>
              <Text style={[styles.healthScoreTitle, { color: themeColors.text }]}>{t('nutrition.healthScore')}</Text>
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
                    ? t('nutrition.excellentBalance')
                    : secondaryData.healthScore >= 4 
                    ? t('nutrition.goodBalance')
                    : t('nutrition.poorBalance'))
                : t('nutrition.noScoreYet')}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function AppleHealthCard() {
  const { t } = useLanguage();
  const { colors: themeColors, isDark } = useTheme();
  const { settings, rolloverCalories, featureStatus, burnedCalories, requestHealthPermission } = useAppSettings();
  
  if (settings.calorieRollover && rolloverCalories && rolloverCalories.amount > 0) {
  return (
    <View style={[styles.appleHealthCard, { backgroundColor: themeColors.card }]}>
        <View style={styles.appleHealthContent}>
          <View style={[styles.appleHealthIcon, { backgroundColor: isDark ? themeColors.gray5 : "#E8F5E9" }]}>
            <Ionicons name="arrow-forward-circle" size={24} color="#4CAF50" />
          </View>
          <Text style={[styles.rolloverTitle, { color: themeColors.text }]}>{t('nutrition.calorieRollover')}</Text>
          <Text style={[styles.rolloverValue, { color: "#4CAF50" }]}>+{rolloverCalories.amount}</Text>
          <Text style={[styles.appleHealthText, { color: themeColors.textSecondary }]}>
            {t('common.from')} {rolloverCalories.fromDate}
          </Text>
        </View>
      </View>
    );
  }
  
  if (featureStatus.healthAuthorized && burnedCalories) {
    return (
      <View style={[styles.appleHealthCard, { backgroundColor: themeColors.card }]}>
        <View style={styles.appleHealthContent}>
          <View style={[styles.appleHealthIcon, { backgroundColor: isDark ? themeColors.gray5 : "#E8F5E9" }]}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
          </View>
          <View style={styles.healthConnectedInfo}>
            <Text style={[styles.healthConnectedTitle, { color: themeColors.text }]}>{t('appSettings.healthConnected')}</Text>
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
          {t('appSettings.tapToConnectHealth')}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={themeColors.textTertiary} style={styles.healthArrow} />
      </View>
    </TouchableOpacity>
  );
}

function BurnedCaloriesCard() {
  const { t } = useLanguage();
  const { colors: themeColors, isDark } = useTheme();
  const { settings, burnedCalories } = useAppSettings();
  
  const activeCalories = settings.burnedCalories && burnedCalories 
    ? burnedCalories.activeCalories 
    : 0;
  const steps = settings.burnedCalories && burnedCalories 
    ? burnedCalories.steps 
    : 0;
    const stepsCalories = Math.round(steps * 0.04);
  
  return (
    <View style={[styles.burnedCard, { backgroundColor: themeColors.card }]}>
      <Text style={[styles.burnedLabel, { color: themeColors.textSecondary }]}>{t('nutrition.burnedCalories')}</Text>
      <View style={styles.burnedRow}>
        <Text style={[styles.burnedValue, { color: activeCalories > 0 ? themeColors.warning : themeColors.text }]}>
          {activeCalories}
        </Text>
        <Text style={[styles.burnedUnit, { color: themeColors.textSecondary }]}>{t('units.kcal')}</Text>
      </View>
      <View style={styles.stepsRow}>
        <Ionicons name="walk" size={18} color={themeColors.textSecondary} />
        <Text style={[styles.stepsLabel, { color: themeColors.text }]}>{steps.toLocaleString()} {t('units.steps')}</Text>
      </View>
      <Text style={[styles.stepsValue, { color: themeColors.textSecondary }]}>~{stepsCalories} {t('units.kcal')}</Text>
      
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
  const { t } = useLanguage();
  const { colors: themeColors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.waterCard,
        {
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
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
  const flatListRef = useRef<any>(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentPage(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const pages = useMemo(() => [
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
  ], [stats, onAddWater]);

  const keyExtractor = useCallback((_: any, index: number) => `page-${index}`, []);

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <View style={[styles.pageWrapper, { width: SCREEN_WIDTH }]}>
        {item}
      </View>
    ),
    []
  );

  const dotStyles = useMemo(() => pages.map((_, index) => [
    styles.dot,
    { backgroundColor: currentPage === index ? themeColors.primary : themeColors.gray4 },
    currentPage === index && styles.dotActive,
  ]), [currentPage, themeColors, pages]);

  return (
    <View style={styles.container}>
      <FlashList
        ref={flatListRef}
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={true}
        drawDistance={250}
      />
      <View style={styles.pagination}>
        {pages.map((_, index) => (
          <View
            key={index}
            style={dotStyles[index]}
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
    marginBottom: Platform.OS === "ios" ? 14 : 12,
    paddingVertical: Platform.OS === "ios" ? 48 : 40,
    paddingHorizontal: Platform.OS === "ios" ? 32 : 26,
    borderRadius: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  caloriesLeft: {
    gap: 3,
  },
  caloriesRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  caloriesValue: {
    fontSize: Platform.OS === "ios" ? 40 : 36,
    fontFamily: "Inter_700Bold",
    lineHeight: Platform.OS === "ios" ? 44 : 40,
    letterSpacing: -1,
  },
  caloriesTarget: {
    fontSize: Platform.OS === "ios" ? 16 : 15,
    fontFamily: "Inter_500Medium",
    letterSpacing: -0.3,
  },
  caloriesLabel: {
    fontSize: Platform.OS === "ios" ? 13 : 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: -0.1,
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
    paddingHorizontal: 16,
    gap: 8,
  },
  extraMacrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  macroCardWrapper: {
    flex: 1,
  },
  macroCard: {
    padding: Platform.OS === "ios" ? 14 : 10,
    borderRadius: 14,
    alignItems: "flex-start",
  },
  macroValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  macroValue: {
    fontSize: Platform.OS === "ios" ? 16 : 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  macroTarget: {
    fontSize: Platform.OS === "ios" ? 12 : 10,
    fontFamily: "Inter_500Medium",
  },
  macroLabel: {
    fontSize: Platform.OS === "ios" ? 12 : 10,
    fontFamily: "Inter_500Medium",
    marginTop: 1,
    marginBottom: 6,
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
    fontSize: Platform.OS === "ios" ? 16 : 14,
  },

  healthScoreCard: {
    marginHorizontal: 16,
    padding: Platform.OS === "ios" ? 16 : 14,
    borderRadius: 14,
  },
  healthScoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  healthScoreTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  healthScoreValue: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  healthScoreBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 10,
  },
  healthScoreBarFill: {
    width: "30%",
    height: "100%",
    borderRadius: 2,
  },
  healthScoreText: {
    fontSize: Platform.OS === "ios" ? 14 : 12,
    fontFamily: "Inter_400Regular",
    lineHeight: Platform.OS === "ios" ? 20 : 17,
  },

  activityRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },
  appleHealthCard: {
    flex: 1,
    padding: Platform.OS === "ios" ? 18 : 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    minHeight: Platform.OS === "ios" ? 130 : 110,
  },
  appleHealthContent: {
    alignItems: "center",
    gap: 8,
  },
  appleHealthIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  appleHealthText: {
    fontSize: Platform.OS === "ios" ? 14 : 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  healthConnectedInfo: {
    alignItems: "center",
    gap: 3,
  },
  healthConnectedTitle: {
    fontSize: Platform.OS === "ios" ? 13 : 11,
    fontFamily: "Inter_600SemiBold",
  },
  healthStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 3,
  },
  healthStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  healthStatValue: {
    fontSize: Platform.OS === "ios" ? 14 : 12,
    fontFamily: "Inter_600SemiBold",
  },
  healthArrow: {
    marginTop: 3,
  },
  burnedCard: {
    flex: 1,
    padding: Platform.OS === "ios" ? 18 : 14,
    borderRadius: 14,
  },
  burnedLabel: {
    fontSize: Platform.OS === "ios" ? 13 : 11,
    fontFamily: "Inter_500Medium",
    marginBottom: 3,
  },
  burnedRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
    marginBottom: 10,
  },
  burnedValue: {
    fontSize: Platform.OS === "ios" ? 24 : 20,
    fontFamily: "Inter_700Bold",
  },
  burnedUnit: {
    fontSize: Platform.OS === "ios" ? 14 : 12,
    fontFamily: "Inter_500Medium",
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  stepsLabel: {
    fontSize: Platform.OS === "ios" ? 14 : 12,
    fontFamily: "Inter_600SemiBold",
  },
  stepsValue: {
    fontSize: Platform.OS === "ios" ? 13 : 11,
    fontFamily: "Inter_500Medium",
    marginTop: 1,
  },
  burnedDisabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  burnedDisabledText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  rolloverTitle: {
    fontSize: Platform.OS === "ios" ? 13 : 11,
    fontFamily: "Inter_600SemiBold",
    marginTop: 3,
  },
  rolloverValue: {
    fontSize: Platform.OS === "ios" ? 24 : 20,
    fontFamily: "Inter_700Bold",
  },

  waterCard: {
    marginHorizontal: 16,
    padding: Platform.OS === "ios" ? 16 : 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  waterIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  waterInfo: {
    flex: 1,
  },
  waterLabel: {
    fontSize: Platform.OS === "ios" ? 14 : 12,
    fontFamily: "Inter_600SemiBold",
  },
  waterValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  waterValue: {
    fontSize: Platform.OS === "ios" ? 14 : 12,
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
