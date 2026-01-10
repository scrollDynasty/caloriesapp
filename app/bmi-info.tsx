import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

export default function BMIInfoScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  
  const BMI_CATEGORIES = {
    underweight: { label: t('bmi.underweight'), color: "#4DABF7", range: "<18.5" },
    normal: { label: t('bmi.normal'), color: "#51CF66", range: "18.5–24.9" },
    overweight: { label: t('bmi.overweight'), color: "#FFD43B", range: "25.0–29.9" },
    obese: { label: t('bmi.obese'), color: "#FF6B6B", range: ">30.0" },
  };
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
    marginBottom: 20,
  },
  bmiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  bmiLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  bmiValue: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  scaleContainer: {
    position: "relative",
    marginBottom: 14,
  },
  scaleBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  scaleSegment: {
    height: "100%",
  },
  indicator: {
    position: "absolute",
    top: -2,
    width: 2,
    height: 12,
    transform: [{ translateX: -1 }],
  },
  indicatorLine: {
    width: 2,
    height: "100%",
    borderRadius: 1,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    width: "48%",
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: 2,
  },
  legendText: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    lineHeight: 13,
  },
  infoSection: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  bulletList: {
    marginTop: 10,
  },
  bulletItem: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  sourceLink: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "underline",
    marginTop: 6,
  },
});
