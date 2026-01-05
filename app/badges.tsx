import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import BadgeCelebration from "../components/ui/BadgeCelebration";
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
  const { colors, isDark } = useTheme();

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
          <Text style={[styles.circleBadgeTitle, { color: isDark ? "#FFFFFF" : colors.text }]}>
            {badge.title}
          </Text>
          <Text style={[styles.circleBadgeDesc, { color: "#8E8E93" }]}>
            {badge.description}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function BadgesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalBadges, setTotalBadges] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [celebratingBadge, setCelebratingBadge] = useState<string | null>(null);
  const celebrationQueue = useRef<string[]>([]);

  const loadBadges = useCallback(async () => {
    try {
      const checkResult = await apiService.checkBadges();
      
      if (checkResult.new_badges && checkResult.new_badges.length > 0) {
        celebrationQueue.current = checkResult.new_badges.map(b => b.badge_id);
        setCelebratingBadge(celebrationQueue.current[0]);
      }
      
      const [badgesData, progressData] = await Promise.all([
        apiService.getBadges(),
        apiService.getProgressData(),
      ]);

      setBadges(badgesData.badges);
      setTotalEarned(badgesData.total_earned);
      setTotalBadges(badgesData.total_badges);
      setStreakCount(progressData.streak_count);
        } catch (err) {
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

  const handleCelebrationClose = useCallback(async () => {
    const closedBadge = celebrationQueue.current.shift();
    
    if (closedBadge) {
          try {
            await apiService.markBadgesSeen([closedBadge]);
          } catch (err) {
          }
    }
    
    if (celebrationQueue.current.length > 0) {
      setTimeout(() => setCelebratingBadge(celebrationQueue.current[0]), 300);
    } else {
      setCelebratingBadge(null);
    }
  }, []);

  const streakBadges = badges.filter((b) => b.category === "streak");
  const activityBadges = badges.filter((b) => b.category === "activity");
  const nutritionBadges = badges.filter((b) => b.category === "nutrition");
  const specialBadges = badges.filter((b) => b.category === "special");

  const progress = totalBadges > 0 ? totalEarned / totalBadges : 0;
  const progressPercent = Math.round(progress * 100);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#000000" : "#FFFDF6" }]} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <Animated.View entering={FadeInDown.springify()}>
            <Text style={[styles.loadingText, { color: isDark ? "#8E8E93" : "#1C1C1E" }]}>
              Загрузка достижений
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#000000" : "#FFFDF6" }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" }]}
          onPress={() => {
            hapticLight();
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? "#FFFFFF" : "#1C1C1E" }]}>
          Достижения
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Большая темная карточка - Серия дней */}
        <Animated.View 
          entering={FadeInDown.delay(100).springify()} 
          style={[
            styles.streakCardContainer,
            { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }
          ]}
        >
          <LinearGradient
            colors={isDark ? ["#2C2C2E", "#1C1C1E"] : ["#2C2C2E", "#1C1C1E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakCard}
          >
            <View style={styles.streakContent}>
              <Text style={[styles.streakNumber, { color: "#FFFFFF" }]}>{streakCount}</Text>
            </View>
            <Text style={[styles.streakLabel, { color: "#FFFFFF" }]}>СЕРИЯ ДНЕЙ</Text>
          </LinearGradient>

          {/* Прогресс секция */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: isDark ? "#FFFFFF" : colors.text }]}>
                Прогресс
              </Text>
              <Text style={[styles.progressValue, { color: isDark ? "#FFFFFF" : colors.text }]}>
                {totalEarned}/{totalBadges}
              </Text>
            </View>

            <View style={[styles.progressBarBg, { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }]}>
              <View style={[
                styles.progressBarFill, 
                { 
                  width: `${progressPercent}%`,
                  backgroundColor: isDark ? "#FFFFFF" : "#1C1C1E"
                }
              ]} />
            </View>

            <Text style={[styles.progressLabel, { color: isDark ? "#8E8E93" : colors.textSecondary }]}>
              {progressPercent}% выполнено
            </Text>
          </View>
        </Animated.View>

        {/* Стрик секция */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : colors.text }]}>
              Стрик
            </Text>
            <Text style={[styles.sectionCount, { color: isDark ? "#8E8E93" : colors.textSecondary }]}>
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
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : colors.text }]}>
                Активность 🍽️
              </Text>
              <Text style={[styles.sectionCount, { color: isDark ? "#8E8E93" : colors.textSecondary }]}>
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
          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : colors.text }]}>
                Питание
              </Text>
              <Text style={[styles.sectionCount, { color: isDark ? "#8E8E93" : colors.textSecondary }]}>
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
              <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : colors.text }]}>
                Особые
              </Text>
              <Text style={[styles.sectionCount, { color: isDark ? "#8E8E93" : colors.textSecondary }]}>
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

      {/* Анимация нового значка */}
      {celebratingBadge && (
        <BadgeCelebration
          visible={celebratingBadge !== null}
          badgeType={celebratingBadge}
          onClose={handleCelebrationClose}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginTop: 8,
  },
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
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    marginRight: 40,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  streakCardContainer: {
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 24,
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
    alignItems: "center",
    justifyContent: "center",
  },
  streakNumber: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    lineHeight: 48,
  },
  streakLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
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
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
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
