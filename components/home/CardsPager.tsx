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
import { CaloriesCard } from "./CaloriesCard";
import { MacrosCards } from "./MacrosCards";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 40;

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

const CIRCLE_SIZE = 44;
const STROKE_WIDTH = 4;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ExtraMacroCard({ value, label, icon, color }: { value: string; label: string; icon: string; color: string }) {
  return (
    <View style={styles.extraMacroCard}>
      <Text style={styles.extraMacroValue}>{value}</Text>
      <Text style={styles.extraMacroLabel}>{label} <Text style={styles.labelLight}>left</Text></Text>
      <View style={styles.extraMacroIconContainer}>
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke="#F2EFE9"
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
            strokeDasharray="2 4"
          />
        </Svg>
        <View style={styles.iconCenter}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
      </View>
    </View>
  );
}

function HealthScoreCard() {
  return (
    <View style={styles.healthScoreCard}>
      <View style={styles.healthScoreHeader}>
        <Text style={styles.healthScoreTitle}>Оценка здоровья</Text>
        <Text style={styles.healthScoreValue}>Н/д</Text>
      </View>
      <View style={styles.healthScoreBar}>
        <View style={styles.healthScoreBarBg} />
      </View>
      <Text style={styles.healthScoreText}>
        Отмечай несколько продуктов, чтобы получить твой балл здоровья на сегодня. Твой балл отражает содержание питательных веществ и ст...
      </Text>
    </View>
  );
}

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
        <TouchableOpacity style={styles.waterBtn} onPress={onAdd}>
          <Ionicons name="add" size={20} color={colors.white} style={styles.waterBtnAdd} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
    // Page 1: Calories + Main Macros
    <View key="page1" style={styles.pageContainer}>
      <CaloriesCard
        consumedCalories={stats.consumedCalories}
        targetCalories={stats.targetCalories}
      />
      <MacrosCards
        protein={stats.protein}
        carbs={stats.carbs}
        fats={stats.fats}
      />
    </View>,

    // Page 2: Extra Macros + Health Score
    <View key="page2" style={styles.pageContainer}>
      <View style={styles.extraMacrosRow}>
        <ExtraMacroCard value="38g" label="Клетчатка" icon="🍆" color="#9B59B6" />
        <ExtraMacroCard value="90g" label="Сахар" icon="🍬" color="#E91E63" />
        <ExtraMacroCard value="2300mg" label="Натрий" icon="🧂" color="#FF9800" />
      </View>
      <HealthScoreCard />
    </View>,

    // Page 3: Apple Health + Burned + Water
    <View key="page3" style={styles.pageContainer}>
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
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DAD4CA",
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  // Extra Macros
  extraMacrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  extraMacroCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 18,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  extraMacroValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
    marginBottom: 2,
  },
  extraMacroLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
    marginBottom: 14,
  },
  labelLight: {
    color: colors.secondary,
    opacity: 0.75,
  },
  extraMacroIconContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignSelf: "center",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 14,
  },
  // Health Score
  healthScoreCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  healthScoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  healthScoreTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
  },
  healthScoreValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: colors.secondary,
  },
  healthScoreBar: {
    height: 6,
    backgroundColor: "#F2EFE9",
    borderRadius: 3,
    marginBottom: 12,
  },
  healthScoreBarBg: {
    width: "30%",
    height: "100%",
    backgroundColor: "#DAD4CA",
    borderRadius: 3,
  },
  healthScoreText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
    lineHeight: 18,
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
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
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
    fontSize: 13,
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
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  burnedLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
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
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stepsLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.primary,
  },
  stepsValue: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
    marginTop: 2,
  },
  // Water
  waterCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  waterIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E8F4FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  waterInfo: {
    flex: 1,
  },
  waterLabel: {
    fontSize: 14,
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
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
  },
  waterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  waterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F2EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  waterBtnAdd: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 8,
    overflow: "hidden",
  },
});

