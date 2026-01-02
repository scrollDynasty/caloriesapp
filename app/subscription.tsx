import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const isSmallScreen = SCREEN_WIDTH < 375;
const isMediumScreen = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;

type PlanType = {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  priceDetail?: string;
  features: string[];
  gradient: [string, string];
  buttonText: string;
  popular: boolean;
};

const PLANS: { free: PlanType; premium: PlanType } = {
  free: {
    id: "free",
    name: "Базовый",
    price: "Бесплатно",
    priceValue: 0,
    features: [
      "Оценка калорийности для основных узбекских блюд",
      "Health Score для блюд",
      "Базовый трекинг воды",
      "Базовая активность",
      "Ограниченный доступ к рецептам",
    ],
    gradient: ["#6B7280", "#9CA3AF"],
    buttonText: "Текущий план",
    popular: false,
  },
  premium: {
    id: "premium",
    name: "Премиум",
    price: "30 000 сум",
    priceDetail: "в месяц",
    priceValue: 30000,
    features: [
      "Полный доступ к базе данных блюд",
      "Расширенные рецепты с пошаговыми инструкциями",
      "Детализированный анализ микронутриентов",
      "Анализ сахара, натрия, клетчатки",
      "Персонализированные планы питания",
      "Адаптация планов с помощью ИИ",
      "Умный Онбординг",
      "Поддержка сообщества",
      "Приоритетная поддержка",
    ],
    gradient: ["#FF6B35", "#FFB84D"],
    buttonText: "Попробовать Premium",
    popular: true,
  },
};

export default function SubscriptionScreen() {
  const { colors, isDark } = useTheme();
  const [selectedPlan] = useState<"premium">("premium");

  const handlePurchase = () => {
    // Здесь будет интеграция с платежной системой
    Alert.alert(
      "Скоро доступно",
      "Оплата Premium подписки скоро будет доступна. Мы оповестим вас!",
      [{ text: "Хорошо" }]
    );
  };

  // Определяем цвета в зависимости от темы
  const premiumGradient = isDark 
    ? [colors.card || "#1C1C1E", colors.card || "#2C2C2E"] as [string, string]
    : ["#FF6B35", "#FFB84D"] as [string, string];
  
  const cardBackground = isDark ? colors.card : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : colors.text;
  const secondaryTextColor = isDark ? "rgba(255,255,255,0.8)" : colors.textSecondary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.backButtonText, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Выберите план</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            Разблокируйте Premium{"\n"}для достижения целей быстрее
          </Text>
        </View>

        {/* Premium Plan Card */}
        <View style={styles.plansContainer}>
          <LinearGradient
            colors={premiumGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.planCard, styles.planCardSelected]}
          >
            {/* Plan Header */}
            <View style={styles.planHeader}>
              <View style={styles.planHeaderContent}>
                <Text style={[styles.planName, { color: textColor }]}>
                  {PLANS.premium.name}
                </Text>
                <View style={styles.priceContainer}>
                  <Text style={[styles.planPrice, { color: textColor }]}>
                    {PLANS.premium.price}
                  </Text>
                  <Text style={[styles.priceDetail, { color: secondaryTextColor }]}>
                    {PLANS.premium.priceDetail}
                  </Text>
                </View>
              </View>
            </View>

            {/* Features */}
            <View style={styles.featuresContainer}>
              {PLANS.premium.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={[styles.checkmark, { color: textColor }]}>
                    ✓
                  </Text>
                  <Text style={[styles.featureText, { color: secondaryTextColor }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* No Payment Info */}
        <View style={styles.noPaymentContainer}>
          <Text style={[styles.noPaymentText, { color: colors.textSecondary }]}>
            ✓ Платеж не требуется сейчас
          </Text>
        </View>

      </ScrollView>

      {/* Purchase Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={handlePurchase}
          style={styles.purchaseButton}
        >
          <View style={[styles.purchaseButtonContent, { backgroundColor: isDark ? "#1C1C1E" : "#000000" }]}>
            <Text style={[styles.purchaseButtonText, { color: "#FFFFFF" }]}>
              Продолжить
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: isSmallScreen ? 12 : 16,
  },
  backButton: {
    width: isSmallScreen ? 36 : 40,
    height: isSmallScreen ? 36 : 40,
    borderRadius: isSmallScreen ? 18 : 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: isSmallScreen ? 22 : 24,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: "600",
  },
  placeholder: {
    width: isSmallScreen ? 36 : 40,
  },
  titleSection: {
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: isSmallScreen ? 20 : 24,
    alignItems: "center",
  },
  mainTitle: {
    fontSize: isSmallScreen ? 26 : isMediumScreen ? 30 : 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: isSmallScreen ? 8 : 12,
    lineHeight: isSmallScreen ? 32 : isMediumScreen ? 36 : 40,
    paddingHorizontal: isSmallScreen ? 8 : 0,
  },
  subtitle: {
    fontSize: isSmallScreen ? 14 : 16,
    textAlign: "center",
    lineHeight: isSmallScreen ? 20 : 22,
    paddingHorizontal: isSmallScreen ? 12 : 0,
  },
  plansContainer: {
    paddingHorizontal: isSmallScreen ? 16 : 20,
    gap: isSmallScreen ? 12 : 16,
  },
  planCard: {
    borderRadius: isSmallScreen ? 16 : 20,
    padding: isSmallScreen ? 16 : 20,
    borderWidth: 1.5,
    marginBottom: isSmallScreen ? 10 : 12,
  },
  planCardSelected: {
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 0,
  },
  planHeaderContent: {
    flex: 1,
  },
  popularBadge: {
    position: "absolute",
    top: isSmallScreen ? -10 : -12,
    right: isSmallScreen ? 16 : 24,
    backgroundColor: "#FFD60A",
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 4 : 6,
    borderRadius: isSmallScreen ? 10 : 12,
  },
  popularText: {
    color: "#000000",
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: isSmallScreen ? 18 : 24,
  },
  planName: {
    fontSize: isSmallScreen ? 20 : isMediumScreen ? 22 : 24,
    fontWeight: "700",
    marginBottom: isSmallScreen ? 6 : 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: isSmallScreen ? 4 : 6,
    flexWrap: "wrap",
  },
  planPrice: {
    fontSize: isSmallScreen ? 24 : isMediumScreen ? 26 : 28,
    fontWeight: "800",
  },
  priceDetail: {
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: "500",
  },
  currentBadge: {
    backgroundColor: "#34C759",
    paddingHorizontal: isSmallScreen ? 10 : 12,
    paddingVertical: isSmallScreen ? 4 : 6,
    borderRadius: isSmallScreen ? 6 : 8,
  },
  currentText: {
    color: "#FFFFFF",
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: "600",
  },
  featuresContainer: {
    gap: isSmallScreen ? 10 : 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: isSmallScreen ? 10 : 12,
  },
  checkmark: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: "700",
    marginTop: isSmallScreen ? 1 : 2,
    minWidth: isSmallScreen ? 16 : 18,
  },
  featureText: {
    fontSize: isSmallScreen ? 13 : isMediumScreen ? 14 : 15,
    lineHeight: isSmallScreen ? 20 : 22,
    flex: 1,
    fontWeight: "500",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: isSmallScreen ? 12 : 16,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        paddingBottom: isSmallScreen ? 20 : 24,
      },
      android: {
        paddingBottom: isSmallScreen ? 12 : 16,
      },
    }),
  },
  purchaseButton: {
    borderRadius: isSmallScreen ? 14 : 16,
    overflow: "hidden",
  },
  purchaseButtonContent: {
    paddingVertical: isSmallScreen ? 16 : 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: isSmallScreen ? 14 : 16,
  },
  purchaseButtonText: {
    fontSize: isSmallScreen ? 16 : isMediumScreen ? 17 : 18,
    fontWeight: "700",
  },
  noPaymentContainer: {
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingTop: isSmallScreen ? 16 : 20,
    alignItems: "center",
  },
  noPaymentText: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: "500",
  },
});

