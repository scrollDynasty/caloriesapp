import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";
import { useFonts } from "../../hooks/use-fonts";

/**
 * Главный экран приложения
 */
export default function HomeScreen() {
  const fontsLoaded = useFonts();

  if (!fontsLoaded) {
    return null;
  }

  // Моковые данные для примера
  const stats = {
    targetCalories: 2320,
    consumedCalories: 815,
    remainingCalories: 1505,
    protein: { consumed: 54, target: 166 },
    carbs: { consumed: 39, target: 227 },
    fats: { consumed: 60, target: 83 },
  };

  const recentMeals = [
    {
      id: 1,
      name: "Жареная курица",
      time: "22:10",
      calories: 988,
      protein: 54,
      carbs: 39,
      fats: 60,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Ionicons name="nutrition" size={28} color={colors.primary} />
            <Text style={styles.appName}>Cal AI</Text>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color="#FF6B35" />
            <Text style={styles.streakText}>1</Text>
          </View>
        </View>

        {/* Calendar Week */}
        <View style={styles.calendarContainer}>
          {["С", "Ч", "П", "С", "В", "П", "В"].map((day, index) => {
            const date = 27 + index;
            const isToday = index === 5;
            return (
              <View key={index} style={styles.calendarDay}>
                <Text style={styles.calendarDayName}>{day}</Text>
                <View
                  style={[
                    styles.calendarDate,
                    isToday && styles.calendarDateActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.calendarDateText,
                      isToday && styles.calendarDateTextActive,
                    ]}
                  >
                    {date > 31 ? date - 31 : date}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Calories Card */}
        <View style={styles.caloriesCard}>
          <Text style={styles.caloriesNumber}>
            {stats.remainingCalories}
          </Text>
          <Text style={styles.caloriesLabel}>Осталось ккал</Text>
          <Ionicons
            name="flame-outline"
            size={32}
            color={colors.primary}
            style={styles.caloriesIcon}
          />
        </View>

        {/* Macros */}
        <View style={styles.macrosContainer}>
          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>
              {stats.protein.consumed}S
            </Text>
            <Text style={styles.macroLabel}>Белки ост.</Text>
            <Ionicons
              name="fish"
              size={24}
              color="#FF6B6B"
              style={styles.macroIcon}
            />
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>
              {stats.carbs.consumed}S
            </Text>
            <Text style={styles.macroLabel}>Углеводы ост.</Text>
            <Ionicons
              name="pizza"
              size={24}
              color="#FFB84D"
              style={styles.macroIcon}
            />
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>
              {stats.fats.consumed}S
            </Text>
            <Text style={styles.macroLabel}>Жиры ост.</Text>
            <Ionicons
              name="water"
              size={24}
              color="#4D9EFF"
              style={styles.macroIcon}
            />
          </View>
        </View>

        {/* Recent Meals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Недавно добавлено</Text>
          {recentMeals.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealImage}>
                <Ionicons name="fast-food" size={40} color={colors.primary} />
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
                    {meal.protein}S
                  </Text>
                  <Text style={styles.mealMacro}>
                    <Ionicons name="pizza" size={14} color="#FFB84D" />{" "}
                    {meal.carbs}S
                  </Text>
                  <Text style={styles.mealMacro}>
                    <Ionicons name="water" size={14} color="#4D9EFF" />{" "}
                    {meal.fats}S
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={32} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
    fontFamily: "Inter_700Bold",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B35",
    fontFamily: "Inter_600SemiBold",
  },
  calendarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  calendarDay: {
    alignItems: "center",
    gap: 8,
  },
  calendarDayName: {
    fontSize: 14,
    color: colors.secondary,
    fontFamily: "Inter_400Regular",
  },
  calendarDate: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDateActive: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
  },
  calendarDateText: {
    fontSize: 16,
    color: colors.secondary,
    fontFamily: "Inter_400Regular",
  },
  calendarDateTextActive: {
    color: colors.primary,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  caloriesCard: {
    backgroundColor: colors.white,
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    position: "relative",
  },
  caloriesNumber: {
    fontSize: 64,
    fontWeight: "700",
    color: colors.primary,
    fontFamily: "Inter_700Bold",
  },
  caloriesLabel: {
    fontSize: 16,
    color: colors.secondary,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  caloriesIcon: {
    position: "absolute",
    top: 32,
    right: 32,
  },
  macrosContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    position: "relative",
  },
  macroValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: colors.secondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  macroIcon: {
    position: "absolute",
    bottom: 16,
  },
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
  fab: {
    position: "absolute",
    bottom: 100,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
