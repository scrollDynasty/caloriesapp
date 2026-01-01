import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { BadgeCelebration } from "../components/ui/BadgeCelebration";
import { useAppSettings } from "../context/AppSettingsContext";
import { useTheme } from "../context/ThemeContext";
import { apiService } from "../services/api";
import { hapticLight, hapticMedium, hapticSuccess } from "../utils/haptics";

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

interface BadgeCardProps {
  badge: BadgeData;
  index: number;
  colors: any;
  isDark: boolean;
  isNew: boolean;
  onPress: () => void;
}

function BadgeCard({ badge, index, colors, isDark, isNew, onPress }: BadgeCardProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      index * 50,
      withSpring(1, { damping: 12, stiffness: 100 })
    );
    opacity.value = withDelay(index * 50, withSpring(1));
    
    if (isNew) {
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.3, { duration: 500 }),
        withTiming(1, { duration: 500 }),
        withTiming(0.5, { duration: 300 })
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const cardBg = badge.is_earned
    ? isDark
      ? colors.card
      : "#FFFFF0"
    : isDark
    ? colors.cardSecondary
    : "#F5F5F5";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        hapticLight();
        onPress();
      }}
    >
      <Animated.View
        style={[
          styles.badgeCard,
          { backgroundColor: cardBg },
          !badge.is_earned && styles.badgeCardLocked,
          animatedStyle,
        ]}
      >
        {isNew && (
          <Animated.View
            style={[
              styles.newBadgeGlow,
              { borderColor: badge.color },
              glowStyle,
            ]}
          />
        )}

        <View
          style={[
            styles.badgeIconContainer,
            {
              backgroundColor: badge.is_earned ? `${badge.color}20` : colors.fillTertiary,
            },
          ]}
        >
          <Text style={[styles.badgeEmoji, !badge.is_earned && styles.badgeEmojiLocked]}>
            {badge.emoji}
          </Text>
          {!badge.is_earned && (
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
            </View>
          )}
        </View>

        <View style={styles.badgeInfo}>
          <View style={styles.badgeTitleRow}>
            <Text
              style={[
                styles.badgeTitle,
                { color: badge.is_earned ? colors.text : colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {badge.title}
            </Text>
            {isNew && (
              <View style={[styles.newBadge, { backgroundColor: badge.color }]}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.badgeDescription,
              { color: colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {badge.description}
          </Text>
        </View>

        {badge.is_earned ? (
          <View style={[styles.earnedBadge, { backgroundColor: badge.color }]}>
            <Ionicons name="checkmark" size={14} color="#FFF" />
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

function CategorySection({
  title,
  icon,
  badges,
  newBadgeIds,
  colors,
  isDark,
  onBadgePress,
}: {
  title: string;
  icon: string;
  badges: BadgeData[];
  newBadgeIds: Set<string>;
  colors: any;
  isDark: boolean;
  onBadgePress: (badge: BadgeData) => void;
}) {
  const earnedCount = badges.filter((b) => b.is_earned).length;

  return (
    <Animated.View entering={FadeInDown.delay(100)} style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryTitleRow}>
          <Text style={styles.categoryIcon}>{icon}</Text>
          <Text style={[styles.categoryTitle, { color: colors.text }]}>{title}</Text>
        </View>
        <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
          {earnedCount}/{badges.length}
        </Text>
      </View>

      <View style={styles.badgesGrid}>
        {badges.map((badge, index) => (
          <BadgeCard
            key={badge.badge_id}
            badge={badge}
            index={index}
            colors={colors}
            isDark={isDark}
            isNew={newBadgeIds.has(badge.badge_id)}
            onPress={() => onBadgePress(badge)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

function BadgeDetailModal({
  badge,
  onClose,
  colors,
  isDark,
}: {
  badge: BadgeData | null;
  onClose: () => void;
  colors: any;
  isDark: boolean;
}) {
  if (!badge) return null;

  const formattedDate = badge.earned_at
    ? new Date(badge.earned_at).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Animated.View
      entering={FadeIn}
      style={styles.modalOverlay}
    >
      <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
      <Animated.View
        entering={FadeInDown.springify()}
        style={[styles.modalContent, { backgroundColor: isDark ? colors.card : "#FFFFF0" }]}
      >
        <View
          style={[
            styles.modalIconContainer,
            { backgroundColor: badge.is_earned ? `${badge.color}20` : colors.fillTertiary },
          ]}
        >
          <Text style={styles.modalEmoji}>{badge.emoji}</Text>
          {!badge.is_earned && (
            <View style={styles.modalLockBadge}>
              <Ionicons name="lock-closed" size={20} color={colors.textSecondary} />
            </View>
          )}
        </View>

        <Text style={[styles.modalTitle, { color: colors.text }]}>{badge.title}</Text>
        <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
          {badge.description}
        </Text>

        <View style={[styles.requirementBox, { backgroundColor: colors.fillTertiary }]}>
          <Ionicons
            name={badge.is_earned ? "checkmark-circle" : "information-circle"}
            size={20}
            color={badge.is_earned ? badge.color : colors.textSecondary}
          />
          <Text style={[styles.requirementText, { color: colors.text }]}>
            {badge.is_earned ? `Получено ${formattedDate}` : badge.requirement}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.modalCloseButton, { backgroundColor: colors.buttonPrimary }]}
          onPress={onClose}
        >
          <Text style={[styles.modalCloseText, { color: colors.buttonPrimaryText }]}>
            Закрыть
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

export default function BadgesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { settings } = useAppSettings();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [newBadgeIds, setNewBadgeIds] = useState<Set<string>>(new Set());
  const [totalEarned, setTotalEarned] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [celebratingBadge, setCelebratingBadge] = useState<BadgeData | null>(null);
  const celebrationQueue = useRef<BadgeData[]>([]);
  const hasTriggeredCelebration = useRef(false);

  const loadBadges = useCallback(async () => {
    try {
      setError(null);
      
      const checkResult = await apiService.checkBadges();
      
      if (checkResult.new_badges.length > 0 && !hasTriggeredCelebration.current) {
        hasTriggeredCelebration.current = true;
        celebrationQueue.current = [...checkResult.new_badges];
        
        if (settings.badgeCelebrations) {
          hapticSuccess();
          setCelebratingBadge(celebrationQueue.current[0]);
        }
      }

      const data = await apiService.getBadges();
      setBadges(data.badges);
      setTotalEarned(data.total_earned);
      setNewBadgeIds(new Set(data.new_badges));
    } catch (err) {
      console.error("Error loading badges:", err);
      setError("Не удалось загрузить значки");
    } finally {
      setLoading(false);
    }
  }, [settings.badgeCelebrations]);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const handleCelebrationClose = useCallback(async () => {
    const closedBadge = celebrationQueue.current.shift();
    
    if (closedBadge) {
      try {
        await apiService.markBadgesSeen([closedBadge.badge_id]);
        setNewBadgeIds((prev) => {
          const next = new Set(prev);
          next.delete(closedBadge.badge_id);
          return next;
        });
      } catch (err) {
        console.error("Error marking badge seen:", err);
      }
    }
    
    if (celebrationQueue.current.length > 0) {
      setTimeout(() => {
        setCelebratingBadge(celebrationQueue.current[0]);
      }, 300);
    } else {
      setCelebratingBadge(null);
    }
  }, []);

  const handleBadgePress = useCallback(async (badge: BadgeData) => {
    hapticMedium();
    setSelectedBadge(badge);
    
    if (badge.is_earned && !badge.seen) {
      try {
        await apiService.markBadgesSeen([badge.badge_id]);
        setNewBadgeIds((prev) => {
          const next = new Set(prev);
          next.delete(badge.badge_id);
          return next;
        });
      } catch (err) {
        console.error("Error marking badge seen:", err);
      }
    }
  }, []);

  const streakBadges = badges.filter((b) => b.category === "streak");
  const activityBadges = badges.filter((b) => b.category === "activity");
  const nutritionBadges = badges.filter((b) => b.category === "nutrition");
  const specialBadges = badges.filter((b) => b.category === "special");

  const totalBadges = badges.length;
  const progress = totalBadges > 0 ? totalEarned / totalBadges : 0;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Загрузка значков...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => {
            hapticLight();
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Значки</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error || "#FF3B30" }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadBadges}
          >
            <Text style={styles.retryText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown}
            style={[styles.progressCard, { backgroundColor: colors.card }]}
          >
            <View style={styles.progressHeader}>
              <View style={styles.progressInfo}>
                <Text style={[styles.progressTitle, { color: colors.text }]}>
                  Твои достижения
                </Text>
                <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
                  {totalEarned} из {totalBadges} значков получено
                </Text>
              </View>
              {newBadgeIds.size > 0 && (
                <View style={styles.newCountBadge}>
                  <Text style={styles.newCountText}>+{newBadgeIds.size}</Text>
                </View>
              )}
            </View>

            <View style={[styles.progressBar, { backgroundColor: colors.fillTertiary }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%`, backgroundColor: "#FFD700" },
                ]}
              />
            </View>

            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <Text style={[styles.progressStatValue, { color: colors.text }]}>{totalEarned}</Text>
                <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
                  Получено
                </Text>
              </View>
              <View style={[styles.progressStatDivider, { backgroundColor: colors.separator }]} />
              <View style={styles.progressStat}>
                <Text style={[styles.progressStatValue, { color: colors.text }]}>
                  {totalBadges - totalEarned}
                </Text>
                <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
                  Осталось
                </Text>
              </View>
              <View style={[styles.progressStatDivider, { backgroundColor: colors.separator }]} />
              <View style={styles.progressStat}>
                <Text style={[styles.progressStatValue, { color: colors.text }]}>
                  {Math.round(progress * 100)}%
                </Text>
                <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
                  Прогресс
                </Text>
              </View>
            </View>
          </Animated.View>

          {streakBadges.length > 0 && (
            <CategorySection
              title="Стрик"
              icon="🔥"
              badges={streakBadges}
              newBadgeIds={newBadgeIds}
              colors={colors}
              isDark={isDark}
              onBadgePress={handleBadgePress}
            />
          )}

          {activityBadges.length > 0 && (
            <CategorySection
              title="Активность"
              icon="⚡"
              badges={activityBadges}
              newBadgeIds={newBadgeIds}
              colors={colors}
              isDark={isDark}
              onBadgePress={handleBadgePress}
            />
          )}

          {nutritionBadges.length > 0 && (
            <CategorySection
              title="Питание"
              icon="🥗"
              badges={nutritionBadges}
              newBadgeIds={newBadgeIds}
              colors={colors}
              isDark={isDark}
              onBadgePress={handleBadgePress}
            />
          )}

          {specialBadges.length > 0 && (
            <CategorySection
              title="Особые"
              icon="⭐"
              badges={specialBadges}
              newBadgeIds={newBadgeIds}
              colors={colors}
              isDark={isDark}
              onBadgePress={handleBadgePress}
            />
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
          colors={colors}
          isDark={isDark}
        />
      )}

      {celebratingBadge && (
        <BadgeCelebration
          visible={true}
          badgeType={celebratingBadge.badge_id}
          onClose={handleCelebrationClose}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  headerPlaceholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  progressCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  newCountBadge: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newCountText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  progressStat: {
    alignItems: "center",
    flex: 1,
  },
  progressStatValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  progressStatLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  progressStatDivider: {
    width: 1,
    height: 40,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  categoryCount: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  badgesGrid: {
    gap: 10,
  },
  badgeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    position: "relative",
    overflow: "hidden",
  },
  badgeCardLocked: {
    opacity: 0.7,
  },
  newBadgeGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: 16,
  },
  badgeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeEmojiLocked: {
    opacity: 0.4,
  },
  lockOverlay: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 2,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },
  badgeDescription: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  earnedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSpacer: {
    height: 40,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: SCREEN_WIDTH - 48,
    padding: 28,
    borderRadius: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  modalIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
  },
  modalEmoji: {
    fontSize: 48,
  },
  modalLockBadge: {
    position: "absolute",
    bottom: -8,
    right: -8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 14,
    padding: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 20,
  },
  requirementBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    width: "100%",
  },
  requirementText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  modalCloseButton: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalCloseText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
