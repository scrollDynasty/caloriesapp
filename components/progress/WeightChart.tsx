import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useTheme } from "../../context/ThemeContext";

interface WeightChartProps {
  data: Array<{ weight: number; created_at: string }>;
  targetWeight?: number | null;
}

export function WeightChart({ data, targetWeight }: WeightChartProps) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get("window").width - 48;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Начните отслеживать вес для просмотра графика
        </Text>
      </View>
    );
  }

  const sortedData = [...data].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const chartData = sortedData.slice(-15);

  const weights = chartData.map(d => d.weight);
  const labels = chartData.map((d, index) => {
    if (index % Math.ceil(chartData.length / 6) === 0 || index === chartData.length - 1) {
      const date = new Date(d.created_at);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }
    return "";
  });

  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const range = Math.max(maxWeight - minWeight, 2);
  
  return (
    <View style={styles.container}>
      <LineChart
        data={{
          labels: labels,
          datasets: [
            {
              data: weights,
              color: (opacity = 1) => `rgba(82, 113, 255, ${opacity})`,
              strokeWidth: 3,
            },
          ],
        }}
        width={screenWidth}
        height={240}
        chartConfig={{
          backgroundColor: "transparent",
          backgroundGradientFrom: colors.card,
          backgroundGradientTo: colors.card,
          backgroundGradientFromOpacity: 0,
          backgroundGradientToOpacity: 0,
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(82, 113, 255, ${opacity})`,
          labelColor: (opacity = 1) => colors.textTertiary,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: "6",
            strokeWidth: "3",
            stroke: "#5271FF",
            fill: "#fff",
          },
          propsForBackgroundLines: {
            strokeDasharray: "5,5",
            stroke: colors.border,
            strokeWidth: 0.5,
            strokeOpacity: 0.3,
          },
          fillShadowGradient: "#5271FF",
          fillShadowGradientOpacity: 0.15,
        }}
        bezier
        withShadow={false}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLines={false}
        style={styles.chart}
        fromZero={false}
        yAxisSuffix=" кг"
        segments={4}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyContainer: {
    height: 220,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
