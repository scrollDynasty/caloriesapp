import { memo, useEffect, useRef } from "react";
import { Animated, DimensionValue, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton = memo(function Skeleton({ 
  width = "100%", 
  height = 20, 
  borderRadius = 8,
  style 
}: SkeletonProps) {
  const { colors: themeColors, isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { 
          width, 
          height, 
          borderRadius, 
          opacity,
          backgroundColor: isDark ? themeColors.gray4 : "#E8E4DC",
        },
        style,
      ]}
    />
  );
});

export const CaloriesCardSkeleton = memo(function CaloriesCardSkeleton() {
  const { colors: themeColors } = useTheme();
  return (
    <View style={[styles.caloriesCard, { backgroundColor: themeColors.card }]}>
      <View style={styles.caloriesLeft}>
        <Skeleton width={140} height={48} borderRadius={8} />
        <Skeleton width={100} height={14} borderRadius={6} style={{ marginTop: 8 }} />
      </View>
      <Skeleton width={100} height={100} borderRadius={50} />
    </View>
  );
});

export const MacrosRowSkeleton = memo(function MacrosRowSkeleton() {
  const { colors: themeColors } = useTheme();
  return (
    <View style={styles.macrosRow}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.macroCard, { backgroundColor: themeColors.card }]}>
          <Skeleton width={60} height={22} borderRadius={6} />
          <Skeleton width={80} height={12} borderRadius={4} style={{ marginTop: 6 }} />
          <Skeleton width={52} height={52} borderRadius={26} style={{ marginTop: 12, alignSelf: "center" }} />
        </View>
      ))}
    </View>
  );
});

export const NutritionCardSkeleton = memo(function NutritionCardSkeleton() {
  return (
    <View style={styles.nutritionContainer}>
      <CaloriesCardSkeleton />
      <MacrosRowSkeleton />
    </View>
  );
});

export const MealCardSkeleton = memo(function MealCardSkeleton() {
  const { colors: themeColors } = useTheme();
  return (
    <View style={[styles.mealCard, { backgroundColor: themeColors.card }]}>
      <Skeleton width={72} height={72} borderRadius={20} />
      <View style={styles.mealInfo}>
        <View style={styles.mealHeader}>
          <Skeleton width={120} height={16} borderRadius={6} />
          <Skeleton width={40} height={13} borderRadius={4} />
        </View>
        <Skeleton width={80} height={14} borderRadius={4} style={{ marginTop: 4 }} />
        <View style={styles.mealMacros}>
          <Skeleton width={35} height={12} borderRadius={4} />
          <Skeleton width={35} height={12} borderRadius={4} />
          <Skeleton width={35} height={12} borderRadius={4} />
        </View>
      </View>
    </View>
  );
});

export const RecentMealsSkeleton = memo(function RecentMealsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <View style={styles.recentMeals}>
      {Array.from({ length: count }).map((_, i) => (
        <MealCardSkeleton key={i} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  skeleton: {
  },
  nutritionContainer: {
    paddingHorizontal: 0,
  },
  caloriesCard: {
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
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    gap: 10,
  },
  macroCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  mealCard: {
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  mealInfo: {
    flex: 1,
    gap: 4,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealMacros: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  recentMeals: {
    paddingHorizontal: 20,
  },
});

