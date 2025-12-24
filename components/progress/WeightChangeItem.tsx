import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

interface WeightChangeItemProps {
  period: string;
  changeKg: number | null;
  status: string;
}

const PERIOD_LABELS: Record<string, string> = {
  "3_days": "3 дня",
  "7_days": "7 дней",
  "14_days": "14 дней",
  "30_days": "30 дней",
  "90_days": "90 дней",
  "all_time": "За всё время",
};

export function WeightChangeItem({ period, changeKg, status }: WeightChangeItemProps) {
  const { colors } = useTheme();

  const getStatusText = () => {
    if (status === "insufficient_data") {
      return "Недостаточно данных";
    }
    if (status === "no_change") {
      return "Без изменений";
    }
    if (changeKg === null) {
      return "Недостаточно данных";
    }
    return `${Math.abs(changeKg)} кг`;
  };

  const getStatusIcon = () => {
    if (status === "gain") return "trending-up";
    if (status === "loss") return "trending-down";
    return "remove";
  };

  const getStatusColor = () => {
    if (status === "gain") return "#FF6B6B";
    if (status === "loss") return "#51CF66";
    return colors.textSecondary;
  };

  return (
    <View style={styles.item}>
      <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>
        {PERIOD_LABELS[period] || period}
      </Text>
      <View style={styles.changeContainer}>
        <Text style={[styles.changeValue, { color: colors.text }]}>
          {getStatusText()}
        </Text>
        {status !== "insufficient_data" && changeKg !== null && (
          <View style={styles.iconContainer}>
            <Ionicons name={getStatusIcon()} size={16} color={getStatusColor()} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {status === "gain" ? "Рост" : status === "loss" ? "Снижение" : ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  periodLabel: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  changeValue: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
