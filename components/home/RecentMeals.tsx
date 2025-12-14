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
  isManual?: boolean;
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
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Недавно загружено</Text>
      </View>
      
      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.stateText}>Загружаем...</Text>
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
                  <View style={styles.placeholderImage}>
                    <Ionicons name="fast-food" size={32} color="#BDBDBD" />
                  </View>
                )}
              </View>
              <View style={styles.mealInfo}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
                  <Text style={styles.mealTime}>{meal.time}</Text>
                </View>
                <View style={styles.mealCaloriesRow}>
                  <Ionicons name="flame" size={14} color="#1A1A1A" />
                  <Text style={styles.mealCalories}>{meal.calories} ккал</Text>
                </View>
                <View style={styles.mealMacros}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroIcon}>🍖</Text>
                    <Text style={styles.macroText}>{meal.protein}г</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroIcon}>🌾</Text>
                    <Text style={styles.macroText}>{meal.carbs}г</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroIcon}>💧</Text>
                    <Text style={styles.macroText}>{meal.fats}г</Text>
                  </View>
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
        <View style={styles.emptyUploadCard}>
          <View style={styles.emptyUploadInner}>
            <View style={styles.emptyThumb} />
            <View style={styles.emptyLines}>
              <View style={[styles.emptyLine, { width: "70%" }]} />
              <View style={[styles.emptyLine, { width: "55%" }]} />
            </View>
          </View>
          <Text style={styles.emptyUploadText}>
            Нажми +, чтобы добавить первый приём пищи{"\n"}за день
          </Text>
          {onAddPress ? (
            <TouchableOpacity style={styles.hiddenAddArea} onPress={onAddPress} activeOpacity={0.7}>
              <Text style={styles.hiddenAddAreaText}> </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
    letterSpacing: -0.3,
  },
  stateBox: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  errorBox: {
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
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  mealImage: {
    width: 72,
    height: 72,
    borderRadius: 20,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  mealInfo: {
    flex: 1,
    gap: 4,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  mealTime: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#8A8A8A",
  },
  mealCaloriesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mealCalories: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#000000",
    letterSpacing: -0.2,
  },
  mealMacros: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  macroItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  macroIcon: {
    fontSize: 10,
  },
  macroText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#8A8A8A",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: colors.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
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
  emptyUploadCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: "hidden",
  },
  emptyUploadInner: {
    alignSelf: "center",
    width: "88%",
    borderRadius: 18,
    backgroundColor: "#F3F1ED",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
    marginBottom: 14,
  },
  emptyThumb: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#E7E3DC",
  },
  emptyLines: {
    flex: 1,
    gap: 8,
  },
  emptyLine: {
    height: 8,
    borderRadius: 6,
    backgroundColor: "#E0DBD2",
  },
  emptyUploadText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
    textAlign: "center",
    lineHeight: 18,
  },
  hiddenAddArea: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  hiddenAddAreaText: {
    color: "transparent",
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
