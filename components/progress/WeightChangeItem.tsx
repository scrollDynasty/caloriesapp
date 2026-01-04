import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
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
      return "Нет данных";
    }
    if (status === "no_change") {
      return "0 кг";
    }
    if (changeKg === null) {
      return "Нет данных";
    }
    return `${changeKg > 0 ? '+' : ''}${changeKg.toFixed(1)} кг`;
  };

  const getStatusIcon = () => {
    if (status === "gain") return "trending-up";
    if (status === "loss") return "trending-down";
    return null;
  };

  const getStatusColor = () => {
    if (status === "gain") return "#FF6B6B";
    if (status === "loss") return "#51CF66";
    return colors.textSecondary;
  };

  const icon = getStatusIcon();
  const statusColor = getStatusColor();

  return (
    <View style={styles.item}>
      <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>
        {PERIOD_LABELS[period] || period}
      </Text>
      <View style={styles.changeContainer}>
        <Text style={[styles.changeValue, { color: statusColor }]}>
          {getStatusText()}
        </Text>
        {icon && (
          <Ionicons name={icon} size={14} color={statusColor} />
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
    paddingVertical: 10,
  },
  periodLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  changeValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
