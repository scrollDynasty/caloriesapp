import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface BMICardProps {
  bmi: number | null;
  bmiCategory: string | null;
  currentWeight: number | null;
  targetWeight: number | null;
}

const BMI_CATEGORIES: Record<string, { label: string; color: string; range: string }> = {
  underweight: { label: "Недостаточный вес", color: "#4DABF7", range: "<18.5" },
  normal: { label: "Нормальный вес", color: "#51CF66", range: "18.5–24.9" },
  overweight: { label: "Избыточный вес", color: "#FFD43B", range: "25.0–29.9" },
  obese: { label: "Ожирение", color: "#FF6B6B", range: ">30.0" },
};

export function BMICard({ bmi, bmiCategory, currentWeight, targetWeight }: BMICardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handleInfoPress = () => {
    router.push({
      pathname: "/bmi-info" as any,
      params: { 
        bmi: bmi?.toString() || "", 
        category: bmiCategory || "normal" 
      },
    });
  };

  const handleWeightPress = () => {
    router.push({
      pathname: "/change-weight" as any,
      params: { currentWeight: currentWeight?.toString() || "70" },
    });
  };

  if (!bmi || !bmiCategory) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Твой ИМТ</Text>
          <TouchableOpacity onPress={handleInfoPress}>
            <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Недостаточно данных для расчета ИМТ
        </Text>
      </View>
    );
  }

  const categoryInfo = BMI_CATEGORIES[bmiCategory];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Твой ИМТ</Text>
        <TouchableOpacity onPress={handleInfoPress}>
          <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.bmiValueContainer} onPress={handleWeightPress} activeOpacity={0.7}>
        <Text style={[styles.bmiValue, { color: colors.text }]}>{bmi.toFixed(1)}</Text>
        <View style={styles.weightRow}>
          <Text style={[styles.weightLabel, { color: colors.textSecondary }]}>Твой вес</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </View>
        <Text style={[styles.categoryLabel, { color: categoryInfo.color }]}>
          {categoryInfo.label}
        </Text>
      </TouchableOpacity>

      {/* BMI Scale */}
      <View style={styles.scaleContainer}>
        <View style={styles.scaleBar}>
          <View style={[styles.scaleSegment, { backgroundColor: "#4DABF7", flex: 18.5 }]} />
          <View style={[styles.scaleSegment, { backgroundColor: "#51CF66", flex: 6.4 }]} />
          <View style={[styles.scaleSegment, { backgroundColor: "#FFD43B", flex: 4.1 }]} />
          <View style={[styles.scaleSegment, { backgroundColor: "#FF6B6B", flex: 10 }]} />
        </View>
        
        {/* Indicator */}
        <View style={[styles.indicator, { left: `${Math.min(95, (bmi / 40) * 100)}%` }]}>
          <View style={styles.indicatorLine} />
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#4DABF7" }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Недостаточный вес {"\n"}&lt;18.5
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#51CF66" }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Нормальный вес {"\n"}18.5–24.9
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#FFD43B" }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Избыточный вес {"\n"}25.0–29.9
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#FF6B6B" }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Ожирение {"\n"}&gt;30.0
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  bmiValueContainer: {
    alignItems: "flex-start",
    marginBottom: 24,
  },
  bmiValue: {
    fontSize: 48,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  weightLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  scaleContainer: {
    position: "relative",
    marginBottom: 20,
  },
  scaleBar: {
    flexDirection: "row",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  scaleSegment: {
    height: "100%",
  },
  indicator: {
    position: "absolute",
    top: -4,
    width: 2,
    height: 20,
    backgroundColor: "#2D2A26",
    transform: [{ translateX: -1 }],
  },
  indicatorLine: {
    width: 2,
    height: "100%",
    backgroundColor: "#2D2A26",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    minWidth: "45%",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 14,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 20,
  },
});
