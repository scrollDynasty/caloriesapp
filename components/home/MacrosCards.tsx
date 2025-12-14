import { memo, useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../../constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MacrosCardsProps {
  protein: { consumed: number; target: number };
  carbs: { consumed: number; target: number };
  fats: { consumed: number; target: number };
  water?: { consumed: number; target?: number | null };
  onPress?: () => void;
}

const CIRCLE_SIZE = 52;
const STROKE_WIDTH = 4;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface MacroCardProps {
  consumed: number;
  target: number;
  label: string;
  progress: number;
  color: string;
  icon: string;
  onPress?: () => void;
}

function MacroCard({ consumed, target, label, progress, color, icon, onPress }: MacroCardProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: Math.min(1, progress),
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [progress]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <TouchableOpacity 
      style={styles.macroCardWrapper}
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.macroCard, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.valueRow}>
          <Text style={styles.macroValue}>{Math.round(consumed)}</Text>
          <Text style={styles.macroTarget}>/{target}g</Text>
        </View>
        <Text style={styles.macroLabel}>{label} съедено</Text>
        <View style={styles.circleContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
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
              stroke={color}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
            />
          </Svg>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export const MacrosCards = memo(function MacrosCards({ protein, carbs, fats, onPress }: MacrosCardsProps) {
  const data = useMemo(() => [
    {
      consumed: protein.consumed,
      target: protein.target,
      label: "Белки",
      progress: protein.target > 0 ? protein.consumed / protein.target : 0,
      color: "#FF6B6B",
      icon: "🍖",
    },
    {
      consumed: carbs.consumed,
      target: carbs.target,
      label: "Углеводы",
      progress: carbs.target > 0 ? carbs.consumed / carbs.target : 0,
      color: "#FCA549",
      icon: "🌾",
    },
    {
      consumed: fats.consumed,
      target: fats.target,
      label: "Жиры",
      progress: fats.target > 0 ? fats.consumed / fats.target : 0,
      color: "#4D96FF",
      icon: "🫒",
    },
  ], [protein, carbs, fats]);

  return (
    <View style={styles.container}>
      {data.map((item, idx) => (
        <MacroCard key={idx} {...item} onPress={onPress} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 10,
  },
  macroCardWrapper: {
    flex: 1,
  },
  macroCard: {
    backgroundColor: colors.white,
    padding: 14,
    paddingTop: 14,
    paddingBottom: 14,
    borderRadius: 18,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  valueRow: {
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
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  iconContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 16,
  },
});
