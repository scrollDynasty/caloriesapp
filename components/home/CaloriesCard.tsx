import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../../constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CaloriesCardProps {
  consumedCalories: number;
  targetCalories: number;
  streakCount?: number;
  onPress?: () => void;
}

const CIRCLE_SIZE = 100;
const STROKE_WIDTH = 6;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const CaloriesCard = memo(function CaloriesCard({ consumedCalories, targetCalories, onPress }: CaloriesCardProps) {
  const overConsumed = consumedCalories >= targetCalories;
  const progress = targetCalories > 0 ? Math.min(1, consumedCalories / targetCalories) : 0;
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const flameScale = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const progressColor = overConsumed ? "#FF8C42" : progress >= 1 ? "#4CAF50" : "#C5C0B8";
  const flameColor = "#1A1A1A";

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <TouchableOpacity 
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.caloriesCard, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.leftSection}>
          <View style={styles.caloriesRow}>
            <Text style={styles.consumedCalories}>{Math.round(consumedCalories)}</Text>
            <Text style={styles.targetCalories}>/{targetCalories}</Text>
          </View>
          <Text style={styles.caloriesLabel}>Съеденные калории</Text>
        </View>
        
        <View style={styles.circularProgress}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.svgContainer}>
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke="#E8E4DC"
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
              <Ionicons name="flame" size={28} color={flameColor} />
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
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
  leftSection: {
    gap: 4,
  },
  caloriesRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  consumedCalories: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
    lineHeight: 56,
    letterSpacing: -2,
  },
  targetCalories: {
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
