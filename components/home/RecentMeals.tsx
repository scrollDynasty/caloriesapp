import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constants/theme";

interface Meal {
  id: number;
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  imageUrl?: string;
}

interface RecentMealsProps {
  meals: Meal[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onAddPress?: () => void;
  onLoadMore?: () => void;
}

export const RecentMeals = memo(function RecentMeals({
  meals,
  loading = false,
  error = null,
  onRetry,
  onAddPress,
  onLoadMore,
}: RecentMealsProps) {
  const hasMeals = useMemo(() => meals.length > 0, [meals.length]);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Недавно добавлено</Text>
      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.stateText}>Загружаем последние блюда...</Text>
        </View>
      ) : error ? (
        <TouchableOpacity style={[styles.stateBox, styles.errorBox]} onPress={onRetry}>
          <Ionicons name="warning-outline" size={24} color="#C62828" />
          <Text style={[styles.stateText, styles.errorText]}>{error}</Text>
          {onRetry ? <Text style={styles.linkText}>Повторить</Text> : null}
        </TouchableOpacity>
      ) : hasMeals ? (
        <>
          {meals.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealImage}>
                {meal.imageUrl ? (
                  <Image
                    source={{ uri: meal.imageUrl }}
                    style={styles.image}
                    contentFit="cover"
                    cachePolicy="disk"
                  />
                ) : (
                  <Ionicons name="fast-food" size={40} color={colors.primary} />
                )}
              </View>
              <View style={styles.mealInfo}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealName} numberOfLines={2}>
                    {meal.name}
                  </Text>
                  <View style={styles.mealTimeBadge}>
                    <Ionicons name="time-outline" size={14} color={colors.primary} />
                    <Text style={styles.mealTime}>{meal.time}</Text>
                  </View>
                </View>
                <Text style={styles.mealCalories}>
                  <Ionicons name="flame" size={16} color="#FF6B35" /> {meal.calories} ккал
                </Text>
                <View style={styles.mealMacros}>
                  <Text style={styles.mealMacro}>
                    <Ionicons name="fish" size={14} color="#FF6B6B" /> {meal.protein}Г
                  </Text>
                  <Text style={styles.mealMacro}>
                    <Ionicons name="pizza" size={14} color="#FFB84D" /> {meal.carbs}Г
                  </Text>
                  <Text style={styles.mealMacro}>
                    <Ionicons name="water" size={14} color="#4D9EFF" /> {meal.fats}Г
                  </Text>
                </View>
              </View>
            </View>
          ))}
          {onLoadMore ? (
            <TouchableOpacity style={styles.loadMore} onPress={onLoadMore} activeOpacity={0.8}>
              <Text style={styles.loadMoreText}>Показать ещё</Text>
            </TouchableOpacity>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={48} color={colors.secondary} />
          <Text style={styles.emptyStateText}>Пока нет добавленных приемов пищи</Text>
          <Text style={styles.emptyStateSubtext}>Нажмите кнопку "+" чтобы добавить еду</Text>
          {onAddPress ? (
            <TouchableOpacity style={styles.addButton} onPress={onAddPress} activeOpacity={0.8}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addButtonText}>Добавить</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
  },
  stateBox: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  errorBox: {
    borderColor: "#F2C2C2",
    backgroundColor: "#FFF5F5",
  },
  stateText: {
    fontSize: 14,
    color: colors.secondary,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  errorText: {
    color: "#C62828",
  },
  linkText: {
    fontSize: 14,
    color: colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  mealCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  mealImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  mealInfo: {
    flex: 1,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
    flexWrap: "wrap",
  },
  mealName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
  },
  mealTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F5F7FB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  mealTime: {
    fontSize: 13,
    color: colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  mealMacros: {
    flexDirection: "row",
    gap: 16,
  },
  mealMacro: {
    fontSize: 12,
    color: colors.secondary,
    fontFamily: "Inter_400Regular",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.secondary,
    fontFamily: "Inter_600SemiBold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.secondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    opacity: 0.7,
  },
  addButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  loadMore: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
});
