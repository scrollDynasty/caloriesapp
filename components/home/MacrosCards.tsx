import { memo, useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../../constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MacrosCardsProps {
  protein: { consumed: number; target: number };
  carbs: { consumed: number; target: number };
  fats: { consumed: number; target: number };
  water?: { consumed: number; target?: number | null };
}

const CIRCLE_SIZE = 44;
const STROKE_WIDTH = 4;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface MacroCardProps {
  value: string;
  label: string;
  progress: number;
  color: string;
  icon: string;
}

function MacroCard({ value, label, progress, color, icon }: MacroCardProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: Math.min(1, progress),
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [progress]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroLabel}>
        {label} <Text style={styles.macroLabelLight}>left</Text>
      </Text>
      <View style={styles.circleContainer}>
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
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
    </View>
  );
}

export const MacrosCards = memo(function MacrosCards({ protein, carbs, fats }: MacrosCardsProps) {
  const data = useMemo(() => [
    {
      value: `${Math.max(0, protein.target - protein.consumed)}g`,
      label: "Белки",
      progress: protein.target > 0 ? protein.consumed / protein.target : 0,
      color: "#FF6B6B",
      icon: "🍖",
    },
    {
      value: `${Math.max(0, carbs.target - carbs.consumed)}g`,
      label: "Углеводы",
      progress: carbs.target > 0 ? carbs.consumed / carbs.target : 0,
      color: "#FCA549",
      icon: "🌾",
    },
    {
      value: `${Math.max(0, fats.target - fats.consumed)}g`,
      label: "Жиры",
      progress: fats.target > 0 ? fats.consumed / fats.target : 0,
      color: "#4D96FF",
      icon: "💧",
    },
  ], [protein, carbs, fats]);

  return (
    <View style={styles.container}>
      {data.map((item, idx) => (
        <MacroCard key={idx} {...item} />
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
  macroCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderRadius: 18,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  macroValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
    marginBottom: 14,
  },
  macroLabelLight: {
    color: colors.secondary,
    opacity: 0.75,
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
    fontSize: 14,
  },
});
