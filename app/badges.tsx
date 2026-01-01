import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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
    withSpring
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { apiService } from "../services/api";
import { hapticLight, hapticMedium } from "../utils/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface BadgeConfig {
  id: string;
  emoji: string;
  title: string;
  description: string;
  requirement: string;
  color: string;
  category: "streak" | "activity" | "nutrition" | "special";
}

const ALL_BADGES: BadgeConfig[] = [
  // Streak значки
  {
    id: "streak_3",
    emoji: "🔥",
    title: "Первые шаги",
    description: "3 дня подряд",
    requirement: "Отслеживай питание 3 дня подряд",
    color: "#FF9500",
    category: "streak",
  },
  {
    id: "streak_7",
    emoji: "🔥",
    title: "Неделя силы",
    description: "7 дней подряд",
    requirement: "Отслеживай питание неделю подряд",
    color: "#FF6B00",
    category: "streak",
  },
  {
    id: "streak_14",
    emoji: "⚡",
    title: "Две недели",
    description: "14 дней подряд",
    requirement: "Отслеживай питание 2 недели подряд",
    color: "#FFD700",
    category: "streak",
  },
  {
    id: "streak_30",
    emoji: "🏆",
    title: "Месяц чемпиона",
    description: "30 дней подряд",
    requirement: "Отслеживай питание месяц подряд",
    color: "#FFD700",
    category: "streak",
  },
  {
    id: "streak_100",
    emoji: "💎",
    title: "Легенда",
    description: "100 дней подряд",
    requirement: "Отслеживай питание 100 дней подряд",
    color: "#00CED1",
    category: "streak",
  },
  // Activity значки
  {
    id: "first_meal",
    emoji: "🍽️",
    title: "Первое блюдо",
    description: "Начало пути",
    requirement: "Добавь своё первое блюдо",
    color: "#FF6B6B",
    category: "activity",
  },
  {
    id: "meals_10",
    emoji: "🥗",
    title: "Гурман",
    description: "10 блюд",
    requirement: "Добавь 10 блюд",
    color: "#4CAF50",
    category: "activity",
  },
  {
    id: "meals_50",
    emoji: "👨‍🍳",
    title: "Шеф-повар",
    description: "50 блюд",
    requirement: "Добавь 50 блюд",
    color: "#FF9800",
    category: "activity",
  },
  {
    id: "meals_100",
    emoji: "🌟",
    title: "Мастер кухни",
    description: "100 блюд",
    requirement: "Добавь 100 блюд",
    color: "#9C27B0",
    category: "activity",
  },
  {
    id: "water_champion",
    emoji: "💧",
    title: "Водный чемпион",
    description: "Норма воды",
    requirement: "Выполни норму воды за день",
    color: "#2196F3",
    category: "activity",
  },
  {
    id: "early_bird",
    emoji: "🌅",
    title: "Ранняя пташка",
    description: "Завтрак до 9",
    requirement: "Завтракай до 9 утра 7 дней подряд",
    color: "#FFD60A",
    category: "activity",
  },
  // Nutrition значки
  {
    id: "goal_reached",
    emoji: "✅",
    title: "Цель достигнута",
    description: "Дневная норма",
    requirement: "Достигни дневной нормы калорий",
    color: "#34C759",
    category: "nutrition",
  },
  {
    id: "macro_master",
    emoji: "📊",
    title: "Мастер макросов",
    description: "Идеальный баланс",
    requirement: "Достигни идеального баланса БЖУ",
    color: "#AF52DE",
    category: "nutrition",
  },
  {
    id: "healthy_week",
    emoji: "💚",
    title: "Здоровая неделя",
    description: "7 дней здоровья",
    requirement: "Получи оценку здоровья 7+ всю неделю",
    color: "#34C759",
    category: "nutrition",
  },
  {
    id: "protein_power",
    emoji: "💪",
    title: "Сила белка",
    description: "Норма белка",
    requirement: "Достигни нормы белка 7 дней подряд",
    color: "#FF6B6B",
    category: "nutrition",
  },
  // Special значки
  {
    id: "weight_milestone",
    emoji: "⚖️",
    title: "Веховой результат",
    description: "Важная отметка",
    requirement: "Достигни важной отметки в весе",
    color: "#007AFF",
    category: "special",
  },
  {
    id: "scanner_pro",
    emoji: "📸",
    title: "Сканер-про",
    description: "20 сканирований",
    requirement: "Отсканируй 20 блюд",
    color: "#5856D6",
    category: "special",
  },
  {
    id: "recipe_explorer",
    emoji: "📖",
    title: "Исследователь",
    description: "10 рецептов",
    requirement: "Попробуй 10 разных рецептов",
    color: "#FF2D55",
    category: "special",
  },
  {
    id: "night_owl",
    emoji: "🦉",
    title: "Сова",
    description: "Поздний ужин",
    requirement: "Добавь блюдо после 22:00",
    color: "#5856D6",
    category: "special",
  },
];

interface BadgeCardProps {
  badge: BadgeConfig;
  isEarned: boolean;
  earnedDate?: string;
  index: number;
  colors: any;
  isDark: boolean;
  onPress: () => void;
}

function BadgeCard({ badge, isEarned, earnedDate, index, colors, isDark, onPress }: BadgeCardProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      index * 50,
      withSpring(1, { damping: 12, stiffness: 100 })
    );
    opacity.value = withDelay(index * 50, withSpring(1));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const cardBg = isEarned
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
          !isEarned && styles.badgeCardLocked,
          animatedStyle,
        ]}
      >
        {/* Иконка значка */}
        <View
          style={[
            styles.badgeIconContainer,
            {
              backgroundColor: isEarned ? `${badge.color}20` : colors.fillTertiary,
            },
          ]}
        >
          <Text style={[styles.badgeEmoji, !isEarned && styles.badgeEmojiLocked]}>
            {badge.emoji}
          </Text>
          {!isEarned && (
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
            </View>
          )}
        </View>

        {/* Информация */}
        <View style={styles.badgeInfo}>
          <Text
            style={[
              styles.badgeTitle,
              { color: isEarned ? colors.text : colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {badge.title}
          </Text>
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

        {/* Статус */}
        {isEarned ? (
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
  earnedBadges,
  colors,
  isDark,
  onBadgePress,
}: {
  title: string;
  icon: string;
  badges: BadgeConfig[];
  earnedBadges: Set<string>;
  colors: any;
  isDark: boolean;
  onBadgePress: (badge: BadgeConfig) => void;
}) {
  const earnedCount = badges.filter((b) => earnedBadges.has(b.id)).length;

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
            key={badge.id}
            badge={badge}
            isEarned={earnedBadges.has(badge.id)}
            index={index}
            colors={colors}
            isDark={isDark}
            onPress={() => onBadgePress(badge)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

function BadgeDetailModal({
  badge,
  isEarned,
  onClose,
  colors,
  isDark,
}: {
  badge: BadgeConfig | null;
  isEarned: boolean;
  onClose: () => void;
  colors: any;
  isDark: boolean;
}) {
  if (!badge) return null;

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
            { backgroundColor: isEarned ? `${badge.color}20` : colors.fillTertiary },
          ]}
        >
          <Text style={styles.modalEmoji}>{badge.emoji}</Text>
          {!isEarned && (
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
            name={isEarned ? "checkmark-circle" : "information-circle"}
            size={20}
            color={isEarned ? badge.color : colors.textSecondary}
          />
          <Text style={[styles.requirementText, { color: colors.text }]}>
            {isEarned ? "Получено!" : badge.requirement}
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
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());
  const [streakCount, setStreakCount] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState<BadgeConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadgesData();
  }, []);

  const loadBadgesData = async () => {
    try {
      // Получаем данные о прогрессе
      const progressData = await apiService.getProgressData();
      setStreakCount(progressData.streak_count || 0);

      // Определяем полученные значки на основе данных
      const earned = new Set<string>();

      // Streak значки
      if (progressData.streak_count >= 3) earned.add("streak_3");
      if (progressData.streak_count >= 7) earned.add("streak_7");
      if (progressData.streak_count >= 14) earned.add("streak_14");
      if (progressData.streak_count >= 30) earned.add("streak_30");
      if (progressData.streak_count >= 100) earned.add("streak_100");

      // Первое блюдо (если есть хоть какой-то стрик)
      if (progressData.streak_count >= 1) earned.add("first_meal");

      // Значок значков
      if (progressData.badges_count >= 5) earned.add("goal_reached");

      setEarnedBadges(earned);
    } catch (error) {
      console.error("Error loading badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBadgePress = (badge: BadgeConfig) => {
    hapticMedium();
    setSelectedBadge(badge);
  };

  const streakBadges = ALL_BADGES.filter((b) => b.category === "streak");
  const activityBadges = ALL_BADGES.filter((b) => b.category === "activity");
  const nutritionBadges = ALL_BADGES.filter((b) => b.category === "nutrition");
  const specialBadges = ALL_BADGES.filter((b) => b.category === "special");

  const totalEarned = earnedBadges.size;
  const totalBadges = ALL_BADGES.length;
  const progress = totalBadges > 0 ? totalEarned / totalBadges : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Заголовок */}
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Общий прогресс */}
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
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={[styles.streakValue, { color: colors.text }]}>{streakCount}</Text>
            </View>
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

        {/* Категории значков */}
        <CategorySection
          title="Стрик"
          icon="🔥"
          badges={streakBadges}
          earnedBadges={earnedBadges}
          colors={colors}
          isDark={isDark}
          onBadgePress={handleBadgePress}
        />

        <CategorySection
          title="Активность"
          icon="⚡"
          badges={activityBadges}
          earnedBadges={earnedBadges}
          colors={colors}
          isDark={isDark}
          onBadgePress={handleBadgePress}
        />

        <CategorySection
          title="Питание"
          icon="🥗"
          badges={nutritionBadges}
          earnedBadges={earnedBadges}
          colors={colors}
          isDark={isDark}
          onBadgePress={handleBadgePress}
        />

        <CategorySection
          title="Особые"
          icon="⭐"
          badges={specialBadges}
          earnedBadges={earnedBadges}
          colors={colors}
          isDark={isDark}
          onBadgePress={handleBadgePress}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Модальное окно деталей значка */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          isEarned={earnedBadges.has(selectedBadge.id)}
          onClose={() => setSelectedBadge(null)}
          colors={colors}
          isDark={isDark}
        />
      )}
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
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 159, 67, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  streakEmoji: {
    fontSize: 18,
  },
  streakValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
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
  },
  badgeCardLocked: {
    opacity: 0.7,
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
  badgeTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
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
  // Modal styles
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

