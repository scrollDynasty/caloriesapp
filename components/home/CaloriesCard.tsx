import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";

interface CaloriesCardProps {
  consumedCalories: number;
  targetCalories: number;
  streakCount?: number;
}

export const CaloriesCard = memo(function CaloriesCard({ consumedCalories, targetCalories, streakCount = 0 }: CaloriesCardProps) {
  const remainingCalories = Math.max(0, targetCalories - consumedCalories);
  const overConsumed = consumedCalories >= targetCalories;
  const progress = targetCalories > 0 ? Math.min(1, consumedCalories / targetCalories) : 0;

  const flameColor = overConsumed ? "#FF8C42" : colors.primary;
  const badgeBg = overConsumed ? "rgba(255,140,66,0.12)" : "rgba(63,94,252,0.10)";
  const barColor = flameColor;
  const barWidth = Math.min(1, progress);

  return (
    <View style={styles.caloriesCard}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Калории</Text>
        <View style={[styles.flameBadge, { backgroundColor: badgeBg }]}>
          <Ionicons
            name={overConsumed ? "flame" : "flame-outline"}
            size={18}
            color={flameColor}
          />
          <Text style={[styles.badgeText, { color: flameColor }]}>
            {streakCount || Math.round(progress * 100)}{streakCount ? "" : "%"}
          </Text>
        </View>
      </View>
      <View style={styles.valuesRow}>
        <View style={styles.valueCol}>
          <Text style={styles.valueNumber}>{consumedCalories}</Text>
          <Text style={styles.valueLabel}>Съедено</Text>
        </View>
        <View style={styles.valueCol}>
          <Text style={styles.valueNumber}>{targetCalories}</Text>
          <Text style={styles.valueLabel}>Цель</Text>
        </View>
        <View style={styles.valueCol}>
          <Text style={[styles.valueNumber, overConsumed && styles.overNumber]}>
            {remainingCalories}
          </Text>
          <Text style={styles.valueLabel}>Осталось</Text>
        </View>
      </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: barWidth, backgroundColor: barColor }]} />
        </View>
    </View>
  );
});

const styles = StyleSheet.create({
  caloriesCard: {
    backgroundColor: colors.white,
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    position: "relative",
    gap: 12,
  },
  caloriesIcon: {
    position: "absolute",
    top: 32,
    right: 32,
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },
  flameBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
  },
  valuesRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  valueCol: {
    flexBasis: "32%",
    flexGrow: 1,
    minWidth: 110,
    backgroundColor: "#F7F7F9",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 4,
  },
  valueNumber: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },
  valueLabel: {
    fontSize: 11.5,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
  },
  overNumber: {
    color: "#C62828",
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
});
