import { Ionicons } from "@expo/vector-icons";
import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";

interface MacrosCardsProps {
  protein: { consumed: number; target: number };
  carbs: { consumed: number; target: number };
  fats: { consumed: number; target: number };
}

export const MacrosCards = memo(function MacrosCards({ protein, carbs, fats }: MacrosCardsProps) {
  // Мемоизируем вычисления остатков
  const { proteinRemaining, carbsRemaining, fatsRemaining } = useMemo(() => ({
    proteinRemaining: Math.max(0, protein.target - protein.consumed),
    carbsRemaining: Math.max(0, carbs.target - carbs.consumed),
    fatsRemaining: Math.max(0, fats.target - fats.consumed),
  }), [protein.target, protein.consumed, carbs.target, carbs.consumed, fats.target, fats.consumed]);

  return (
    <View style={styles.macrosContainer}>
      <View style={styles.macroCard}>
        <Text style={styles.macroValue}>{proteinRemaining}Г</Text>
        <Text style={styles.macroLabel}>Белки ост.</Text>
        <Ionicons
          name="fish"
          size={24}
          color="#FF6B6B"
          style={styles.macroIcon}
        />
      </View>
      <View style={styles.macroCard}>
        <Text style={styles.macroValue}>{carbsRemaining}Г</Text>
        <Text style={styles.macroLabel}>Углеводы ост.</Text>
        <Ionicons
          name="pizza"
          size={24}
          color="#FFB84D"
          style={styles.macroIcon}
        />
      </View>
      <View style={styles.macroCard}>
        <Text style={styles.macroValue}>{fatsRemaining}Г</Text>
        <Text style={styles.macroLabel}>Жиры ост.</Text>
        <Ionicons
          name="water"
          size={24}
          color="#4D9EFF"
          style={styles.macroIcon}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  macrosContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    position: "relative",
  },
  macroValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: colors.secondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  macroIcon: {
    position: "absolute",
    bottom: 16,
  },
});
