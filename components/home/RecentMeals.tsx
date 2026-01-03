import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ProcessingMeal, useProcessingMeals } from "../../context/ProcessingMealsContext";
import { useTheme } from "../../context/ThemeContext";
import { hapticLight } from "../../utils/haptics";
import { RecentMealsSkeleton } from "../ui/Skeleton";

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
  onMealPress?: (meal: Meal) => void;
}

const ProcessingMealCard = memo(function ProcessingMealCard({
  meal,
}: {
  meal: ProcessingMeal;
}) {
  const { colors: themeColors, isDark } = useTheme();
  const progressWidth = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const shimmerPosition = useSharedValue(-100);

  useEffect(() => {
    progressWidth.value = withSpring(meal.progress, {
      damping: 15,
      stiffness: 100,
    });

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    shimmerPosition.value = withRepeat(
      withTiming(200, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, [meal.progress]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerPosition.value }],
  }));

  const isError = meal.status === "error";
  const isCompleted = meal.status === "completed";

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.processingCard,
        { backgroundColor: themeColors.card },
        isError && { borderColor: themeColors.error, borderWidth: 1 },
      ]}
    >
      <View style={styles.processingImageContainer}>
        {meal.uri ? (
          <FastImage
            source={{
              uri: meal.uri,
              priority: FastImage.priority.normal,
              cache: FastImage.cacheControl.immutable,
            }}
            style={[
              styles.processingImage,
              !isCompleted && { opacity: 0.5 },
            ]}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <View
            style={[
              styles.placeholderImage,
              { backgroundColor: isDark ? themeColors.gray5 : "#F0F0F0" },
            ]}
          >
            <Animated.View style={pulseStyle}>
              <Ionicons
                name="camera"
                size={28}
                color={isDark ? themeColors.gray2 : "#BDBDBD"}
              />
            </Animated.View>
          </View>
        )}

        {!isCompleted && !isError && (
          <View style={styles.shimmerOverlay}>
            <Animated.View
              style={[
                styles.shimmer,
                { backgroundColor: "rgba(255,255,255,0.3)" },
                shimmerStyle,
              ]}
            />
          </View>
        )}
      </View>

      <View style={styles.processingContent}>
        <View style={styles.processingHeader}>
          <View style={styles.statusRow}>
            {isError ? (
              <Ionicons name="alert-circle" size={16} color={themeColors.error} />
            ) : isCompleted ? (
              <Ionicons name="checkmark-circle" size={16} color={themeColors.success} />
            ) : (
              <Animated.View style={pulseStyle}>
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={themeColors.primary}
                />
              </Animated.View>
            )}
            <Text
              style={[
                styles.statusText,
                { color: isError ? themeColors.error : themeColors.text },
              ]}
              numberOfLines={1}
            >
              {meal.statusText}
            </Text>
          </View>

          {!isError && (
            <Text
              style={[styles.progressPercent, { color: themeColors.primary }]}
            >
              {Math.round(meal.progress)}%
            </Text>
          )}
        </View>

        {/* Progress Bar */}
        {!isError && (
          <View
            style={[
              styles.progressBarBg,
              { backgroundColor: isDark ? themeColors.gray5 : "#E8E8E8" },
            ]}
          >
            <Animated.View
              style={[
                styles.progressBarFill,
                { backgroundColor: isCompleted ? themeColors.success : themeColors.primary },
                progressBarStyle,
              ]}
            />
          </View>
        )}

        <Text
          style={[styles.processingSubtitle, { color: themeColors.textSecondary }]}
          numberOfLines={1}
        >
          {isError
            ? meal.error || "Попробуйте снова"
            : isCompleted
            ? "Блюдо добавлено!"
            : "Мы уведомим по готовности"}
        </Text>
      </View>
    </Animated.View>
  );
});

export const RecentMeals = memo(function RecentMeals({
  meals,
  loading = false,
  error = null,
  onRetry,
  onAddPress,
  onLoadMore,
  onMealPress,
}: RecentMealsProps) {
  const { colors: themeColors, isDark } = useTheme();
  const { processingMeals } = useProcessingMeals();
  const hasMeals = useMemo(() => meals.length > 0 || processingMeals.length > 0, [meals.length, processingMeals.length]);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Недавно съедено
        </Text>
      </View>

      {loading && meals.length === 0 && processingMeals.length === 0 ? (
        <RecentMealsSkeleton count={2} />
      ) : error ? (
        <TouchableOpacity
          style={[
            styles.stateBox,
            styles.errorBox,
            { backgroundColor: isDark ? themeColors.card : "#FFF5F5" },
          ]}
          onPress={() => {
            hapticLight();
            onRetry?.();
          }}
        >
          <Ionicons name="warning-outline" size={24} color="#C62828" />
          <Text style={[styles.stateText, styles.errorText]}>{error}</Text>
          {onRetry ? (
            <Text style={[styles.linkText, { color: themeColors.primary }]}>
              Повторить
            </Text>
          ) : null}
        </TouchableOpacity>
      ) : hasMeals ? (
        <>
          {processingMeals.map((meal) => (
            <ProcessingMealCard key={meal.id} meal={meal} />
          ))}

          {meals.map((meal) => (
            <TouchableOpacity
              key={meal.id}
              style={[styles.mealCard, { backgroundColor: themeColors.card }]}
              activeOpacity={0.7}
              onPress={() => onMealPress?.(meal)}
            >
              <View style={styles.mealImage}>
                {meal.imageUrl ? (
                  <FastImage
                    source={{
                      uri: meal.imageUrl,
                      priority: FastImage.priority.normal,
                      cache: FastImage.cacheControl.immutable,
                    }}
                    style={styles.image}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                ) : (
                  <View
                    style={[
                      styles.placeholderImage,
                      {
                        backgroundColor: isDark ? themeColors.gray5 : "#F0F0F0",
                      },
                    ]}
                  >
                    <Ionicons
                      name="fast-food"
                      size={32}
                      color={isDark ? themeColors.gray2 : "#BDBDBD"}
                    />
                  </View>
                )}
              </View>
              <View style={styles.mealInfo}>
                <View style={styles.mealHeader}>
                  <Text
                    style={[styles.mealName, { color: themeColors.text }]}
                    numberOfLines={1}
                  >
                    {meal.name}
                  </Text>
                  <Text
                    style={[styles.mealTime, { color: themeColors.textTertiary }]}
                  >
                    {meal.time}
                  </Text>
                </View>
                <View style={styles.mealCaloriesRow}>
                  <Ionicons name="flame" size={14} color={themeColors.text} />
                  <Text style={[styles.mealCalories, { color: themeColors.text }]}>
                    {meal.calories} ккал
                  </Text>
                </View>
                <View style={styles.mealMacros}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroIcon}>🍖</Text>
                    <Text
                      style={[
                        styles.macroText,
                        { color: themeColors.textTertiary },
                      ]}
                    >
                      {meal.protein}г
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroIcon}>🌾</Text>
                    <Text
                      style={[
                        styles.macroText,
                        { color: themeColors.textTertiary },
                      ]}
                    >
                      {meal.carbs}г
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroIcon}>🫒</Text>
                    <Text
                      style={[
                        styles.macroText,
                        { color: themeColors.textTertiary },
                      ]}
                    >
                      {meal.fats}г
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {onLoadMore ? (
            <TouchableOpacity
              style={styles.loadMore}
              onPress={onLoadMore}
              activeOpacity={0.8}
            >
              <Text style={[styles.loadMoreText, { color: themeColors.primary }]}>
                Показать ещё
              </Text>
            </TouchableOpacity>
          ) : null}
        </>
      ) : (
        <View style={[styles.emptyUploadCard, { backgroundColor: themeColors.card }]}>
          <View
            style={[
              styles.emptyUploadInner,
              { backgroundColor: isDark ? themeColors.gray5 : "#F3F1ED" },
            ]}
          >
            <View
              style={[
                styles.emptyThumb,
                { backgroundColor: isDark ? themeColors.gray4 : "#E7E3DC" },
              ]}
            />
            <View style={styles.emptyLines}>
              <View
                style={[
                  styles.emptyLine,
                  {
                    width: "70%",
                    backgroundColor: isDark ? themeColors.gray4 : "#E0DBD2",
                  },
                ]}
              />
              <View
                style={[
                  styles.emptyLine,
                  {
                    width: "55%",
                    backgroundColor: isDark ? themeColors.gray4 : "#E0DBD2",
                  },
                ]}
              />
            </View>
          </View>
          <Text
            style={[styles.emptyUploadText, { color: themeColors.textSecondary }]}
          >
            Нажми +, чтобы добавить первый приём пищи{"\n"}за день
          </Text>
          {onAddPress ? (
            <TouchableOpacity
              style={styles.hiddenAddArea}
              onPress={() => {
                hapticLight();
                onAddPress?.();
              }}
              activeOpacity={0.7}
            >
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
    letterSpacing: -0.3,
  },
  stateBox: {
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  errorBox: {},
  stateText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  errorText: {
    color: "#C62828",
  },
  linkText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  // Processing card styles
  processingCard: {
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  processingImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  processingImage: {
    width: "100%",
    height: "100%",
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  shimmer: {
    width: 50,
    height: "100%",
    transform: [{ skewX: "-20deg" }],
  },
  processingContent: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  processingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  progressPercent: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginLeft: 8,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  processingSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  // Regular meal card styles
  mealCard: {
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
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  mealTime: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  mealCaloriesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mealCalories: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
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
  },
  emptyUploadCard: {
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
  },
  emptyLines: {
    flex: 1,
    gap: 8,
  },
  emptyLine: {
    height: 8,
    borderRadius: 6,
  },
  emptyUploadText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
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
    fontFamily: "Inter_600SemiBold",
  },
});
