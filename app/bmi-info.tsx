import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

const BMI_CATEGORIES = {
  underweight: { label: "Недостаточный вес", color: "#4DABF7", range: "<18.5" },
  normal: { label: "Нормальный вес", color: "#51CF66", range: "18.5–24.9" },
  overweight: { label: "Избыточный вес", color: "#FFD43B", range: "25.0–29.9" },
  obese: { label: "Ожирение", color: "#FF6B6B", range: ">30.0" },
};

export default function BMIInfoScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ bmi: string; category: string }>();
  
  const bmi = params.bmi ? parseFloat(params.bmi) : null;
  const category = params.category as keyof typeof BMI_CATEGORIES || "normal";
  const categoryInfo = BMI_CATEGORIES[category] || BMI_CATEGORIES.normal;

  const handleSourcePress = () => {
    Linking.openURL("https://www.cdc.gov/healthyweight/assessing/bmi/index.html");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>ИМТ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {}
        <View style={styles.bmiSection}>
          <View style={styles.bmiHeader}>
            <Text style={[styles.bmiLabel, { color: colors.text }]}>Твой вес</Text>
            <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + "20" }]}>
              <Text style={[styles.categoryBadgeText, { color: categoryInfo.color }]}>
                {categoryInfo.label}
              </Text>
            </View>
          </View>
          
          {bmi ? (
            <Text style={[styles.bmiValue, { color: colors.text }]}>{bmi.toFixed(1)}</Text>
          ) : (
            <Text style={[styles.bmiValue, { color: colors.textSecondary }]}>—</Text>
          )}

          {}
          <View style={styles.scaleContainer}>
            <View style={styles.scaleBar}>
              <View style={[styles.scaleSegment, { backgroundColor: "#4DABF7", flex: 18.5 }]} />
              <View style={[styles.scaleSegment, { backgroundColor: "#51CF66", flex: 6.4 }]} />
              <View style={[styles.scaleSegment, { backgroundColor: "#FFD43B", flex: 5 }]} />
              <View style={[styles.scaleSegment, { backgroundColor: "#FF6B6B", flex: 10 }]} />
            </View>
            
            {}
            {bmi && (
              <View style={[styles.indicator, { left: `${Math.min(95, Math.max(2, (bmi / 40) * 100))}%` }]}>
                <View style={[styles.indicatorLine, { backgroundColor: colors.text }]} />
              </View>
            )}
          </View>

          {}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#4DABF7" }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                Недостаточный вес{"\n"}&lt;18.5
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#51CF66" }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                Нормальный вес{"\n"}18.5–24.9
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#FFD43B" }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                Избыточный вес{"\n"}25.0–29.9
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#FF6B6B" }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                Ожирение{"\n"}&gt;30.0
              </Text>
            </View>
          </View>
        </View>

        {}
        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Отказ от ответственности
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Как и большинство показателей здоровья, ИМТ не является идеальным тестом. 
            Например, результаты могут быть искажены при беременности или высокой мышечной массе, 
            и он может плохо отражать состояние здоровья у детей или пожилых людей.
          </Text>
        </View>

        {}
        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Так почему же ИМТ важен?
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            В целом: чем выше твой ИМТ, тем выше риск развития ряда заболеваний, 
            связанных с избыточным весом, включая:
          </Text>
          
          <View style={styles.bulletList}>
            <Text style={[styles.bulletItem, { color: colors.textSecondary }]}>• диабет</Text>
            <Text style={[styles.bulletItem, { color: colors.textSecondary }]}>• артрит</Text>
            <Text style={[styles.bulletItem, { color: colors.textSecondary }]}>• заболевания печени</Text>
            <Text style={[styles.bulletItem, { color: colors.textSecondary }]}>
              • несколько видов рака (например молочной железы, толстой кишки и простаты)
            </Text>
            <Text style={[styles.bulletItem, { color: colors.textSecondary }]}>
              • высокое кровяное давление (гипертония)
            </Text>
            <Text style={[styles.bulletItem, { color: colors.textSecondary }]}>
              • высокий уровень холестерина
            </Text>
            <Text style={[styles.bulletItem, { color: colors.textSecondary }]}>• апноэ сна.</Text>
          </View>
        </View>

        {}
        <TouchableOpacity onPress={handleSourcePress}>
          <Text style={[styles.sourceLink, { color: colors.primary }]}>Источник</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  bmiSection: {
    marginBottom: 32,
  },
  bmiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  bmiLabel: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  bmiValue: {
    fontSize: 48,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 24,
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
    width: 3,
    height: 20,
    transform: [{ translateX: -1.5 }],
  },
  indicatorLine: {
    width: 3,
    height: "100%",
    borderRadius: 1.5,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    width: "48%",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
  },
  legendText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  bulletList: {
    marginTop: 12,
  },
  bulletItem: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
  },
  sourceLink: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "underline",
    marginTop: 8,
  },
});
