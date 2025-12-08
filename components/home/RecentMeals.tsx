import { Ionicons } from "@expo/vector-icons";
import { memo, useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
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
}

export const RecentMeals = memo(function RecentMeals({ meals }: RecentMealsProps) {
  // Мемоизируем проверку наличия блюд
  const hasMeals = useMemo(() => meals.length > 0, [meals.length]);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Недавно добавлено</Text>
      {hasMeals ? (
        meals.map((meal) => (
          <View key={meal.id} style={styles.mealCard}>
            <View style={styles.mealImage}>
              {meal.imageUrl ? (
                <Image source={{ uri: meal.imageUrl }} style={styles.image} resizeMode="cover" />
              ) : (
                <Ionicons name="fast-food" size={40} color={colors.primary} />
              )}
            </View>
            <View style={styles.mealInfo}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealTime}>{meal.time}</Text>
              </View>
              <Text style={styles.mealCalories}>
                <Ionicons name="flame" size={16} color="#FF6B35" />{" "}
                {meal.calories} ккал
              </Text>
              <View style={styles.mealMacros}>
                <Text style={styles.mealMacro}>
                  <Ionicons name="fish" size={14} color="#FF6B6B" />{" "}
                  {meal.protein}Г
                </Text>
                <Text style={styles.mealMacro}>
                  <Ionicons name="pizza" size={14} color="#FFB84D" />{" "}
                  {meal.carbs}Г
                </Text>
                <Text style={styles.mealMacro}>
                  <Ionicons name="water" size={14} color="#4D9EFF" />{" "}
                  {meal.fats}Г
                </Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={48} color={colors.secondary} />
          <Text style={styles.emptyStateText}>
            Пока нет добавленных приемов пищи
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Нажмите кнопку "+" чтобы добавить еду
          </Text>
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
  mealCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
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
    alignItems: "center",
    marginBottom: 4,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  mealTime: {
    fontSize: 14,
    color: colors.secondary,
    fontFamily: "Inter_400Regular",
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
});
