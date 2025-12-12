import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../../constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CaloriesCardProps {
  consumedCalories: number;
  targetCalories: number;
  streakCount?: number;
}

const CIRCLE_SIZE = 90;
const STROKE_WIDTH = 6;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const CaloriesCard = memo(function CaloriesCard({ consumedCalories, targetCalories }: CaloriesCardProps) {
  const remainingCalories = Math.max(0, targetCalories - consumedCalories);
  const overConsumed = consumedCalories >= targetCalories;
  const progress = targetCalories > 0 ? Math.min(1, consumedCalories / targetCalories) : 0;
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const flameScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [progress]);

  useEffect(() => {
    if (overConsumed) {
      Animated.sequence([
        Animated.spring(flameScale, {
          toValue: 1.3,
          useNativeDriver: true,
          tension: 50,
          friction: 3,
        }),
        Animated.spring(flameScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 3,
        }),
      ]).start();
    }
  }, [overConsumed]);

  const progressColor = overConsumed ? "#FF8C42" : progress >= 1 ? "#4CAF50" : "#1A1A1A";
  const flameColor = overConsumed ? "#FF8C42" : "#1A1A1A";

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <View style={styles.caloriesCard}>
      <View style={styles.leftSection}>
        <Text style={styles.remainingCalories}>{remainingCalories}</Text>
        <Text style={styles.remainingLabel}>Осталось калорий</Text>
      </View>
      
      <View style={styles.circularProgress}>
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.svgContainer}>
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke="#F2EFE9"
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
          />
          <AnimatedCircle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke={progressColor}
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
          />
        </Svg>
        <View style={styles.progressCenter}>
          <Animated.View style={{ transform: [{ scale: flameScale }] }}>
            <Ionicons name="flame-outline" size={28} color={flameColor} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  caloriesCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 24,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 24,
    elevation: 2,
  },
  leftSection: {
    gap: 6,
  },
  remainingCalories: {
    fontSize: 42,
    fontFamily: "Inter_800ExtraBold",
    color: colors.primary,
    lineHeight: 46,
    letterSpacing: -1.5,
  },
  remainingLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#8A8A8A",
    letterSpacing: -0.2,
  },
  circularProgress: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  svgContainer: {
    position: "absolute",
  },
  progressCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
});
