import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { apiService } from "../services/api";
import { hapticLight, hapticMedium } from "../utils/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface BadgeData {
  badge_id: string;
  emoji: string;
  title: string;
  description: string;
  requirement: string;
  color: string;
  category: string;
  is_earned: boolean;
  earned_at: string | null;
  seen: boolean;  
}

const BADGE_COLORS: Record<string, string> = {
  // Streak
  streak_3: "#FF453A",
  streak_7: "#FF9F0A",
  streak_14: "#FFD60A",
  streak_30: "#32D74B",
  streak_50: "#30D158",
  streak_100: "#64D2FF",
  streak_365: "#BF5AF2",
  streak_1000: "#FF2D55",
  // Meals
  first_meal: "#D1D1D6",
  meals_5: "#AEAEB2",
  meals_10: "#8E8E93",
  meals_25: "#636366",
  meals_50: "#48484A",
  meals_100: "#3A3A3C",
  meals_250: "#FF9500",
  meals_500: "#FF8500",
  meals_1000: "#FFD60A",
  meals_5000: "#BF5AF2",
  // Water
  water_first: "#007AFF",
  water_3days: "#0A84FF",
  water_week: "#5AC8FA",
  water_month: "#32D3E6",
  water_100days: "#30B0C7",
  water_365days: "#00C7E6",
  // Goals
  goal_first: "#34C759",
  goal_3days: "#30D158",
  goal_week: "#32D74B",
  goal_month: "#30DB5B",
  goal_100days: "#00E588",
  goal_perfect: "#FFD60A",
  // Macros
  macro_first: "#AF52DE",
  macro_week: "#BF5AF2",
  protein_week: "#FF6B6B",
  fiber_week: "#A0A000",
  lowcarb_week: "#8BC34A",
  // Healthy
  healthy_first: "#34C759",
  healthy_week: "#32D74B",
  veggies_day: "#8BC34A",
  fruits_day: "#FF3B30",
  nosugar_week: "#636366",
  wholegrains_week: "#D4A574",
  // Weight
  weight_first: "#8E8E93",
  weight_week: "#636366",
  weight_month: "#48484A",
  weight_loss_5kg: "#FF9500",
  weight_loss_10kg: "#FFD60A",
  // Time
  early_bird: "#FFD60A",
  night_owl: "#5856D6",
  regular_meals: "#007AFF",
  breakfast_week: "#FF9500",
  // Scanner
  scanner_first: "#5856D6",
  scanner_10: "#5AC8FA",
  scanner_50: "#64D2FF",
  scanner_100: "#32D3E6",
  scanner_500: "#00C7E6",
  // Variety
  variety_10: "#FF5722",
  variety_25: "#FF6B3B",
  variety_50: "#FF7F54",
  cuisines_5: "#FF9800",
  cuisines_10: "#FFA726",
  // Recipe
  recipe_first: "#FF2D55",
  recipe_5: "#FF3A5A",
  recipe_10: "#FF4765",
  recipe_25: "#FF5470",
  // Collector
  collector_5: "#FFC107",
  collector_10: "#FF9800",
  collector_25: "#FF8700",
  collector_50: "#FFD700",
};

const CircleBadge = ({
  badge,
  index,
  onPress,
}: {
  badge: BadgeData;
  index: number;
  onPress: () => void;
}) => {
  const scale = useSharedValue(0);
  const { colors } = useTheme();

  useEffect(() => {
    scale.value = withDelay(index * 80, withSpring(1, { damping: 15, stiffness: 150 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const badgeColor = BADGE_COLORS[badge.badge_id] || "#3A3A3C";
  const isLocked = !badge.is_earned;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.circleBadgeContainer}
    >
      <Animated.View style={animatedStyle}>
        <View
          style={[
            styles.circleBadge,
            {
              backgroundColor: isLocked ? "#3A3A3C" : badgeColor,
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 5,
            },
          ]}
        >
          {isLocked && (
            <Ionicons name="lock-closed" size={24} color="#8E8E93" />
          )}
          {!isLocked && (
            <Ionicons name="checkmark" size={28} color="#FFFFFF" />
          )}
        </View>

        <View style={styles.circleBadgeText}>
          <Text style={[styles.circleBadgeTitle, { color: colors.text }]}>
            {badge.title}
          </Text>
          <Text style={[styles.circleBadgeDesc, { color: colors.textSecondary }]}>
            {badge.description}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function BadgesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadBadges = useCallback(async () => {
    try {
      const [badgesData, progressData] = await Promise.all([
        apiService.getBadges(),
        apiService.getProgressData(),
      ]);

      setBadges(badgesData.badges);
      setTotalEarned(badgesData.total_earned);
      setStreakCount(progressData.streak_count);
    } catch (err) {
      console.error("Error loading badges:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const handleBadgePress = useCallback((badge: BadgeData) => {
    hapticMedium();
  }, []);

  const streakBadges = badges.filter((b) => b.category === "streak");
  const activityBadges = badges.filter((b) => b.category === "activity");
  const nutritionBadges = badges.filter((b) => b.category === "nutrition");
  const specialBadges = badges.filter((b) => b.category === "special");

  const totalBadges = badges.length;
  const progress = totalBadges > 0 ? totalEarned / totalBadges : 0;
  const progressPercent = Math.round(progress * 100);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: "#FFFDF6" }]} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8500" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#FFFDF6" }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            hapticLight();
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Достижения</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Большая оранжевая карточка - Серия дней */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.streakCardContainer}>
          <LinearGradient
            colors={["#FFAF40", "#FF8500"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakCard}
          >
            <View style={styles.streakContent}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakNumber}>{streakCount}</Text>
            </View>
            <Text style={styles.streakLabel}>СЕРИЯ ДНЕЙ</Text>
          </LinearGradient>

          {/* Прогресс секция */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>Прогресс</Text>
              <Text style={[styles.progressValue, { color: colors.text }]}>
                {totalEarned}/{totalBadges}
              </Text>
            </View>

            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>

            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              {progressPercent}% выполнено
            </Text>
          </View>
        </Animated.View>

        {/* Стрик секция */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Стрик 🔥</Text>
            <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
              {streakBadges.filter((b) => b.is_earned).length}/{streakBadges.length}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesRow}
          >
            {streakBadges.map((badge, index) => (
              <CircleBadge
                key={badge.badge_id}
                badge={badge}
                index={index}
                onPress={() => handleBadgePress(badge)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Активность */}
        {activityBadges.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Активность 🍽️
              </Text>
              <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                {activityBadges.filter((b) => b.is_earned).length}/{activityBadges.length}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesRow}
            >
              {activityBadges.map((badge, index) => (
                <CircleBadge
                  key={badge.badge_id}
                  badge={badge}
                  index={index}
                  onPress={() => handleBadgePress(badge)}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Питание */}
        {nutritionBadges.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Питание 💚
              </Text>
              <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                {nutritionBadges.filter((b) => b.is_earned).length}/{nutritionBadges.length}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesRow}
            >
              {nutritionBadges.map((badge, index) => (
                <CircleBadge
                  key={badge.badge_id}
                  badge={badge}
                  index={index}
                  onPress={() => handleBadgePress(badge)}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Особые */}
        {specialBadges.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Особые ⭐
              </Text>
              <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                {specialBadges.filter((b) => b.is_earned).length}/{specialBadges.length}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesRow}
            >
              {specialBadges.map((badge, index) => (
                <CircleBadge
                  key={badge.badge_id}
                  badge={badge}
                  index={index}
                  onPress={() => handleBadgePress(badge)}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#1C1C1E",
    textAlign: "center",
    marginRight: 40,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  streakCardContainer: {
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    padding: 12,
    gap: 20,
  },
  streakCard: {
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  streakContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  streakEmoji: {
    fontSize: 32,
  },
  streakNumber: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    lineHeight: 48,
  },
  streakLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    opacity: 0.9,
    letterSpacing: 1,
    marginTop: 4,
  },
  progressSection: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  progressValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#F2F2F7",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#7F56D9",
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  sectionCount: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  badgesRow: {
    paddingHorizontal: 20,
    gap: 16,
  },
  circleBadgeContainer: {
    alignItems: "center",
  },
  circleBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  circleBadgeText: {
    marginTop: 7,
    alignItems: "center",
    maxWidth: 90,
  },
  circleBadgeTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 14.4,
  },
  circleBadgeDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 13.2,
    marginTop: -1,
  },
});
