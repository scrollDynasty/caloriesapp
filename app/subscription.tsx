import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

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

export default function SubscriptionScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [selectedPlan] = useState<"premium">("premium");

  const PLANS: { free: PlanType; premium: PlanType } = {
    free: {
      id: "free",
      name: t('subscription.basic'),
      price: t('common.free'),
      priceValue: 0,
      features: [
        t('subscription.basicFeature1'),
        "Health Score для блюд",
        t('subscription.basicFeature2'),
        t('subscription.basicFeature3'),
      ],
      gradient: ["#6B7280", "#9CA3AF"],
      buttonText: t('common.currentPlan'),
      popular: false,
    },
    premium: {
      id: "premium",
      name: t('subscription.premium'),
      price: "30 000 сум",
      priceDetail: t('common.perMonth'),
      priceValue: 30000,
      features: [
        t('subscription.premiumFeature1'),
        t('subscription.premiumFeature2'),
        t('subscription.premiumFeature3'),
        t('subscription.premiumFeature4'),
        t('subscription.premiumFeature5'),
      ],
      gradient: ["#FFFFF0", "#F5F5DC"],
      buttonText: t('common.tryPremium'),
      popular: true,
    },
  };

  const handlePurchase = () => {
    Alert.alert(
      t('common.comingSoon'),
      t('subscription.comingSoonMessage'),
      [{ text: t('common.ok') }]
    );
  };

  const premiumGradient = isDark 
    ? [colors.card || "#1C1C1E", colors.card || "#2C2C2E"] as [string, string]
    : ["#FFFFF0", "#F5F5DC"] as [string, string];
  
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
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('subscription.choosePlan')}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.titleSection}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            {t('subscription.premiumTitle')}
          </Text>
        </View>

        <View style={styles.plansContainer}>
          <LinearGradient
            colors={premiumGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.planCard, styles.planCardSelected]}
          >
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

        <View style={styles.noPaymentContainer}>
          <Text style={[styles.noPaymentText, { color: colors.textSecondary }]}>
            ✓ {t('subscription.noPayment')}
          </Text>
        </View>

      </ScrollView>

      <View style={[styles.footer, { 
        backgroundColor: colors.background, 
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 10)
      }]}>
        <TouchableOpacity
          onPress={handlePurchase}
          style={styles.purchaseButton}
        >
          <View style={[styles.purchaseButtonContent, { backgroundColor: isDark ? "#1C1C1E" : "#000000" }]}>
            <Text style={[styles.purchaseButtonText, { color: "#FFFFFF" }]}>
              {t('common.continue')}
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
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  placeholder: {
    width: 36,
  },
  titleSection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  plansContainer: {
    paddingHorizontal: 12,
    gap: 10,
  },
  planCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  planCardSelected: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0,
  },
  planHeaderContent: {
    flex: 1,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: "800",
  },
  priceDetail: {
    fontSize: 12,
    fontWeight: "500",
  },
  featuresContainer: {
    gap: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 1,
    minWidth: 14,
  },
  featureText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    fontWeight: "500",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        paddingBottom: 16,
      },
      android: {
        paddingBottom: 10,
      },
    }),
  },
  purchaseButton: {
    borderRadius: 10,
    overflow: "hidden",
  },
  purchaseButtonContent: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  purchaseButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  noPaymentContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    alignItems: "center",
  },
  noPaymentText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

