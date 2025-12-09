import { Ionicons } from "@expo/vector-icons";
import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";

interface MacrosCardsProps {
  protein: { consumed: number; target: number };
  carbs: { consumed: number; target: number };
  fats: { consumed: number; target: number };
  water?: { consumed: number; target?: number | null };
}

const formatLiters = (ml: number) => {
  const liters = ml / 1000;
  return parseFloat(liters.toFixed(1)).toString();
};

export const MacrosCards = memo(function MacrosCards({ protein, carbs, fats, water }: MacrosCardsProps) {
  const { proteinRemaining, carbsRemaining, fatsRemaining, waterRemaining, waterTarget, waterConsumed } = useMemo(() => ({
    proteinRemaining: Math.max(0, protein.target - protein.consumed),
    carbsRemaining: Math.max(0, carbs.target - carbs.consumed),
    fatsRemaining: Math.max(0, fats.target - fats.consumed),
    waterRemaining: Math.max(0, (water?.target || 0) - (water?.consumed || 0)),
    waterTarget: water?.target ?? 0,
    waterConsumed: water?.consumed ?? 0,
  }), [protein.target, protein.consumed, carbs.target, carbs.consumed, fats.target, fats.consumed, water?.consumed, water?.target]);

  const items = [
    {
      label: "Белки осталось",
      value: `${proteinRemaining}Г`,
      icon: "fish",
      color: colors.primary,
    },
    {
      label: "Углеводы осталось",
      value: `${carbsRemaining}Г`,
      icon: "pizza",
      color: "#FFB84D",
    },
    {
      label: "Жиры осталось",
      value: `${fatsRemaining}Г`,
      icon: "egg-outline",
      color: "#FF8C42",
    },
  ];

  if (water) {
    const hasGoal = !!waterTarget;
    const waterLabel = hasGoal
      ? `Вода ${formatLiters(waterConsumed)}/${formatLiters(waterTarget)} л`
      : "Вода";
    const waterValue = hasGoal
      ? `${formatLiters(waterRemaining)} л осталось`
      : `${formatLiters(waterConsumed)} л`;
    items.push({
      label: waterLabel,
      value: waterValue,
      icon: "water",
      color: "#1E90FF",
    });
  }

  return (
    <View style={styles.macrosContainer}>
      {items.map((item, idx) => (
        <View key={idx} style={styles.macroCard}>
          <View style={[styles.cardHeader]}>
            <View style={[styles.badge, { backgroundColor: `${item.color}1A` }]}>
              <Ionicons name={item.icon as any} size={16} color={item.color} />
            </View>
            <Text style={[styles.macroLabel, styles.headerLabel]} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
          <Text style={styles.macroValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  macrosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  macroCard: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    position: "relative",
    minWidth: 150,
    gap: 10,
    alignSelf: "stretch",
  },
  macroValue: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  macroLabel: {
    fontSize: 12,
    color: colors.secondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
  },
  macroIcon: {
    position: "absolute",
    bottom: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
    textAlign: "left",
    flexShrink: 1,
  },
});
