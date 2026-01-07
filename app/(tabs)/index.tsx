import { useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CardsPager } from "../../components/home/CardsPager";
import { HomeHeader } from "../../components/home/HomeHeader";
import { RecentMeals } from "../../components/home/RecentMeals";
import { WeekCalendar } from "../../components/home/WeekCalendar";
import { LottieLoader } from "../../components/ui/LottieLoader";
import { NutritionCardSkeleton } from "../../components/ui/Skeleton";
import { useAppSettings } from "../../context/AppSettingsContext";
import { ProcessingMeal, useProcessingMeals } from "../../context/ProcessingMealsContext";
import { useTheme } from "../../context/ThemeContext";
import { useFonts } from "../../hooks/use-fonts";
import { apiService } from "../../services/api";
import { dataCache } from "../../stores/dataCache";
import { showToast } from "../../utils/toast";

import { getLocalDayRange, getLocalTimezoneOffset, getLocalTimezoneOffsetMs } from "../../utils/timezone";

const parseMealDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const hasTz = /[+-]\d\d:\d\d$/.test(value) || value.endsWith("Z");
  const normalized = hasTz ? value : `${value}Z`;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
};


const getDateStr = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const computeWeekDays = (baseDate: Date) => {
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
};

const getWeekStartTimestamp = (dateUtcMs: number) => {
  const localOffsetMs = getLocalTimezoneOffsetMs();
  const d = new Date(dateUtcMs + localOffsetMs);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d.getTime() - localOffsetMs;
};

const dateStrFromTimestamp = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function HomeScreen() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();
  const { 
    settings, 
    burnedCalories, 
    refreshBurnedCalories,
    rolloverCalories,
    calculateRollover,
    setPendingBadgeCelebration 
  } = useAppSettings();
  const { setOnMealCompleted, processingMeals } = useProcessingMeals();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [recentMeals, setRecentMeals] = useState<
    Array<{
      id: number;
      name: string;
      time: string;
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      isManual?: boolean;
      imageUrl?: string;
    }>
  >([]);
  const [selectedDateTimestamp, setSelectedDateTimestamp] = useState<number>(getLocalDayRange().startUtcMs);
  const [weekAchievements, setWeekAchievements] = useState<Record<string, boolean>>({});
  const [dailyProgress, setDailyProgress] = useState<Record<string, number>>({});
  const [streakCount, setStreakCount] = useState(0);
  const weekLoadInProgress = useRef(false);
  const lastWeekLoadedRef = useRef<number | null>(null);
  const todayTs = useMemo(() => getLocalDayRange().startUtcMs, []);
  const isTodaySelected = selectedDateTimestamp === todayTs;
  
  
  const [dailyData, setDailyData] = useState({
    consumedCalories: 0,
    consumedProtein: 0,
    consumedCarbs: 0,
    consumedFats: 0,
    consumedFiber: 0,
    consumedSugar: 0,
    consumedSodium: 0,
    healthScore: null as number | null,
    waterTotal: 0,
    waterGoal: 0,
    meals: [] as Array<{
      id: number;
      name: string;
      time: string;
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    }>,
  });

  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false); 
  const lastLoadedDateRef = useRef<number | null>(null);
  const hasInitializedRecentRef = useRef(false);
  const lastFocusRefreshAtRef = useRef(0);


  const loadUserData = useCallback(async () => {
    const cachedUser = dataCache.getUser();
    const cachedOnboarding = dataCache.getOnboarding();
    
    if (cachedUser && cachedOnboarding) {
      setUserData(cachedUser);
      setOnboardingData(cachedOnboarding);
      setLoading(false);
      hasLoadedRef.current = true;
      return;
    }
    
    if (isLoadingRef.current || hasLoadedRef.current) {
      return;
    }
    
    if (!isMountedRef.current) {
      return;
    }
    
    isLoadingRef.current = true;
    hasLoadedRef.current = true; 
    
    try {
      const userPromise = apiService.getCurrentUser();
      const onboardingPromise = apiService.getOnboardingData().catch(() => null);

      const [user, onboarding] = await Promise.all([userPromise, onboardingPromise]);
      if (!isMountedRef.current) return;
      setUserData(user);
      if (onboarding) {
        setOnboardingData(onboarding);
      }
    } catch {
      if (isMountedRef.current) {
        hasLoadedRef.current = false;
      }
    } finally {
      isLoadingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []); 

  useEffect(() => {
    isMountedRef.current = true;
    
    loadUserData();
    
    return () => {
      isMountedRef.current = false;
      isLoadingRef.current = false;
    };
  }, []);

  const loadDailyData = useCallback(async (dateTimestamp: number, force: boolean = false) => {
    const { dateStr } = getLocalDayRange(dateTimestamp);
    
    const cachedDaily = dataCache.getDailyMeals(dateStr);
    const cachedWater = dataCache.getWater(dateStr);
    
    if (cachedDaily && cachedWater && !force) {
      const token = apiService.getCachedToken() || undefined;
      const mappedCachedMeals = (cachedDaily.meals || []).map((m: any) => {
        let imageUrl: string | undefined = undefined;
        if (m.image_url) {
          const photoIdMatch = m.image_url.match(/\/api\/v1\/meals\/photos\/(\d+)/);
          if (photoIdMatch && photoIdMatch[1]) {
            imageUrl = apiService.getMealPhotoUrl(Number(photoIdMatch[1]), token);
          } else if (m.image_url.startsWith('http://') || m.image_url.startsWith('https://')) {
            imageUrl = m.image_url;
          }
        }
        
        return {
          id: m.id,
          name: m.name || "Блюдо",
          time: m.time || "",
          calories: m.calories ?? 0,
          protein: m.protein ?? 0,
          carbs: m.carbs ?? 0,
          fats: m.fats ?? 0,
          isManual: false,
          imageUrl,
        };
      });
      
      const filteredCachedMeals = mappedCachedMeals.filter(
        (meal) =>
          (meal.calories ?? 0) > 0 ||
          (meal.protein ?? 0) > 0 ||
          (meal.carbs ?? 0) > 0 ||
          (meal.fats ?? 0) > 0
      );
      
      setDailyData({
        consumedCalories: cachedDaily.total_calories,
        consumedProtein: cachedDaily.total_protein,
        consumedCarbs: cachedDaily.total_carbs,
        consumedFats: cachedDaily.total_fat,
        consumedFiber: cachedDaily.total_fiber || 0,
        consumedSugar: cachedDaily.total_sugar || 0,
        consumedSodium: cachedDaily.total_sodium || 0,
        healthScore: cachedDaily.health_score || null,
        waterTotal: cachedWater.total_ml,
        waterGoal: cachedWater.goal_ml || 0,
        meals: cachedDaily.meals,
      });
      
      setRecentMeals(filteredCachedMeals);
      
      const isAchieved = cachedDaily.total_calories >= (onboardingData?.target_calories || 0);
      const caloriesProgress = onboardingData?.target_calories > 0 
        ? Math.min(1, cachedDaily.total_calories / onboardingData.target_calories) 
        : 0;
      
      setDailyProgress((prev) => ({ ...prev, [dateStr]: caloriesProgress }));
      setWeekAchievements((prev) => ({ ...prev, [dateStr]: isAchieved }));
      setStreakCount(cachedDaily.streak_count || 0);
      setDailyLoading(false);
      lastLoadedDateRef.current = dateTimestamp;
      return;
    }
    
    if (!force && lastLoadedDateRef.current === dateTimestamp) {
      return;
    }
    lastLoadedDateRef.current = dateTimestamp;
    
    try {
      if (!cachedDaily) {
        setDailyLoading(true);
      }
      setDailyError(null);

      const [data, water] = await Promise.all([
        apiService.getDailyMeals(dateStr, getLocalTimezoneOffset()),
        apiService.getDailyWater(dateStr, getLocalTimezoneOffset()),
      ]);

      if (!isMountedRef.current) return;
      
      const token = apiService.getCachedToken() || undefined;
      const mappedMeals = (data.meals || []).map((m: any) => {
        let imageUrl: string | undefined = undefined;
        if (m.image_url) {
          const photoIdMatch = m.image_url.match(/\/api\/v1\/meals\/photos\/(\d+)/);
          if (photoIdMatch && photoIdMatch[1]) {
            imageUrl = apiService.getMealPhotoUrl(Number(photoIdMatch[1]), token);
          } else if (m.image_url.startsWith('http://') || m.image_url.startsWith('https://')) {
            imageUrl = m.image_url;
          }
        }
        
        return {
          id: m.id,
          name: m.name || "Блюдо",
          time: m.time || "",
          calories: m.calories ?? 0,
          protein: m.protein ?? 0,
          carbs: m.carbs ?? 0,
          fats: m.fats ?? 0,
          isManual: false,
          imageUrl,
        };
      });
      
      const filteredMeals = mappedMeals.filter(
        (meal) =>
          (meal.calories ?? 0) > 0 ||
          (meal.protein ?? 0) > 0 ||
          (meal.carbs ?? 0) > 0 ||
          (meal.fats ?? 0) > 0
      );
      
      setDailyData({
        consumedCalories: data.total_calories,
        consumedProtein: data.total_protein,
        consumedCarbs: data.total_carbs,
        consumedFats: data.total_fat,
        consumedFiber: data.total_fiber || 0,
        consumedSugar: data.total_sugar || 0,
        consumedSodium: data.total_sodium || 0,
        healthScore: data.health_score || null,
        waterTotal: water.total_ml,
        waterGoal: water.goal_ml || 0,
        meals: data.meals,
      });
      
      setRecentMeals(filteredMeals);
      const isAchieved = data.total_calories >= (onboardingData?.target_calories || 0);
      const caloriesProgress = onboardingData?.target_calories > 0 
        ? Math.min(1, data.total_calories / onboardingData.target_calories) 
        : 0;
      
      setDailyProgress((prev) => ({
        ...prev,
        [dateStr]: caloriesProgress,
      }));
      
      setWeekAchievements((prev) => ({
        ...prev,
        [dateStr]: isAchieved,
      }));
      setStreakCount(data.streak_count || 0);
    } catch {
      if (!isMountedRef.current) return;
      if (!cachedDaily) {
        setDailyError("Ошибка загрузки данных");  
      }
    } finally {
      if (isMountedRef.current) {
        setDailyLoading(false);
      }
    }
  }, [onboardingData?.target_calories, onboardingData?.target_protein, onboardingData?.target_carbs, onboardingData?.target_fat]);

  useEffect(() => {
    if (params?.refresh) {
      loadDailyData(selectedDateTimestamp, true);
    }
  }, [params?.refresh, loadDailyData, selectedDateTimestamp]);

  useEffect(() => {
    const handleMealCompleted = async (completedMeal: ProcessingMeal) => {
        if (completedMeal.result) {
          await loadDailyData(selectedDateTimestamp, true);
          
          if (settings.badgeCelebrations) {
            try {
              await new Promise(resolve => setTimeout(resolve, 1500));
              const checkResult = await apiService.checkBadges();
              if (checkResult.new_badges && checkResult.new_badges.length > 0) {
                const firstBadge = checkResult.new_badges[0];
                setPendingBadgeCelebration(firstBadge.badge_id);
                
                if (checkResult.new_badges.length > 1) {
                  const badgeQueue = checkResult.new_badges.slice(1).map(b => b.badge_id);
                  let queueIndex = 0;
                  
                  const showNextBadge = () => {
                    if (queueIndex < badgeQueue.length) {
                      setTimeout(() => {
                        setPendingBadgeCelebration(badgeQueue[queueIndex]);
                        queueIndex++;
                        if (queueIndex < badgeQueue.length) {
                          showNextBadge();
                        }
                      }, 4000);
                    }
                  };
                  
                  setTimeout(() => showNextBadge(), 4000);
                }
              }
            } catch {
            }
          }
        }
    };
    
    setOnMealCompleted(handleMealCompleted);
    
    return () => setOnMealCompleted(undefined);
  }, [setOnMealCompleted, loadDailyData, selectedDateTimestamp, settings.badgeCelebrations, setPendingBadgeCelebration]);

  const prevGoalReachedRef = useRef(false);
  useEffect(() => {
    if (!settings.badgeCelebrations || !isTodaySelected) return;
    
    const targetCalories = onboardingData?.target_calories || 0;
    const goalReached = dailyData.consumedCalories >= targetCalories && targetCalories > 0;
    
    if (goalReached && !prevGoalReachedRef.current) {
      setPendingBadgeCelebration("goal_reached");
    }
    
    prevGoalReachedRef.current = goalReached;
  }, [
    dailyData.consumedCalories, 
    onboardingData?.target_calories, 
    settings.badgeCelebrations, 
    isTodaySelected,
    setPendingBadgeCelebration
  ]);

  useEffect(() => {
    if (settings.burnedCalories && isTodaySelected) {
      refreshBurnedCalories();
    }
  }, [settings.burnedCalories, isTodaySelected, refreshBurnedCalories]);

  const handleDateSelect = useMemo(() => (date: Date) => {
    const utcMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const { startUtcMs } = getLocalDayRange(utcMs);
    if (startUtcMs !== selectedDateTimestamp) {
      setSelectedDateTimestamp(startUtcMs);
    }
  }, [selectedDateTimestamp]);

  const selectedDate = useMemo(() => {
    return new Date(selectedDateTimestamp + getLocalTimezoneOffsetMs());
  }, [selectedDateTimestamp]);

  const handleScanFood = useCallback(async () => {
    if (!isTodaySelected) {
      showToast.warning("Добавлять можно только в текущий день.", "Доступно только сегодня");
      return;
    }
    
    if (cameraPermission && !cameraPermission.granted) {
      if (cameraPermission.canAskAgain) {
        const result = await requestCameraPermission();
        if (result.granted) {
          router.push("/scan-meal" as any);
        } else {
          showToast.warning(
            "Для сканирования еды необходимо разрешение на использование камеры. Пожалуйста, разрешите доступ в настройках приложения.",
            "Разрешение камеры"
          );
        }
      } else {
        showToast.warning(
          "Для сканирования еды необходимо разрешение на использование камеры. Пожалуйста, разрешите доступ в настройках приложения.",
          "Разрешение камеры"
        );
      }
    } else {
      router.push("/scan-meal" as any);
    }
  }, [isTodaySelected, cameraPermission, requestCameraPermission, router]);

  const handleAddManually = useCallback(() => {
    if (!isTodaySelected) {
      showToast.warning("Добавлять можно только в текущий день.", "Доступно только сегодня");
      return;
    }
    router.push("/add-manual" as any);
  }, [isTodaySelected, router]);

  const handleAddWater = useCallback(() => {
    if (!isTodaySelected) {
      showToast.warning("Добавлять можно только в текущий день.", "Доступно только сегодня");
      return;
    }
    router.push("/add-water" as any);
  }, [isTodaySelected, router]);

  const handleMealPress = useCallback((meal: {
    id: number;
    name: string;
    time: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    isManual?: boolean;
    imageUrl?: string;
  }) => {
    router.push({
      pathname: "/meal-detail",
      params: {
        id: meal.id.toString(),
        name: meal.name,
        time: meal.time,
        calories: meal.calories.toString(),
        protein: meal.protein.toString(),
        carbs: meal.carbs.toString(),
        fats: meal.fats.toString(),
        isManual: meal.isManual ? "true" : "false",
        imageUrl: meal.imageUrl || "",
      },
    } as any);
  }, [router]);

  const loadWeekAchievements = useCallback(
    async (baseDate: Date) => {
      if (!onboardingData?.target_calories) {
        setWeekAchievements({});
        setStreakCount(0);
        return;
      }
      const weekTs = getWeekStartTimestamp(baseDate.getTime());
      const weekKey = `week-${weekTs}`;
      
      const cachedWeek = dataCache.getWeekData(weekKey);
      if (cachedWeek && !dataCache.isWeekStale(weekKey)) {
        setWeekAchievements(cachedWeek.achievements);
        setDailyProgress((prev) => ({ ...prev, ...cachedWeek.progress }));
        lastWeekLoadedRef.current = weekTs;
        return;
      }
      
      if (weekLoadInProgress.current) return;
      if (lastWeekLoadedRef.current === weekTs && cachedWeek) return;
      weekLoadInProgress.current = true;
      
      try {
        const days = computeWeekDays(baseDate);
        const dates = days.map((d) => getDateStr(d));
        const results = await apiService.getDailyMealsBatch(dates, getLocalTimezoneOffset());
        const achievementsMap: Record<string, boolean> = {};
        const progressMap: Record<string, number> = {};
        
        results.forEach((r) => {
          const isAchieved = r.total_calories >= onboardingData.target_calories;
          const caloriesProgress = onboardingData.target_calories > 0 
            ? Math.min(1, r.total_calories / onboardingData.target_calories) 
            : 0;
          achievementsMap[r.date] = isAchieved;
          progressMap[r.date] = caloriesProgress;
        });
        
        dataCache.setWeekData(weekKey, {
          weekKey,
          achievements: achievementsMap,
          progress: progressMap,
        });
        
        setWeekAchievements(achievementsMap);
        setDailyProgress((prev) => ({
          ...prev,
          ...progressMap,
        }));
        
        lastWeekLoadedRef.current = weekTs;
      } catch {

      } finally {
        weekLoadInProgress.current = false;
      }
    },
    [onboardingData?.target_calories]
  );


          useEffect(() => {
            const loadData = async () => {
              await Promise.all([
                loadDailyData(selectedDateTimestamp),
                loadWeekAchievements(new Date(selectedDateTimestamp))
              ]);
            };
            loadData();
          }, [selectedDateTimestamp, loadDailyData, loadWeekAchievements]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    hasLoadedRef.current = false;
    lastLoadedDateRef.current = null;
    
    const { dateStr } = getLocalDayRange(selectedDateTimestamp);
    dataCache.invalidateDailyMeals(dateStr);
    dataCache.invalidateWater(dateStr);
    
    try {
            await loadUserData();
            await loadDailyData(selectedDateTimestamp, true);
    } catch {

    } finally {
      setRefreshing(false);
    }
  }, [selectedDateTimestamp, loadUserData, loadDailyData]);

  const handleLoadMore = async () => {
  };

  const stats = useMemo(() => {
    let targetCalories = onboardingData?.target_calories || 0;
    
    const burnedCaloriesBonus = settings.burnedCalories && burnedCalories 
      ? burnedCalories.activeCalories 
      : 0;
    
    const rolloverBonus = settings.calorieRollover && rolloverCalories 
      ? rolloverCalories.amount 
      : 0;
    
    const adjustedTargetCalories = targetCalories + burnedCaloriesBonus + rolloverBonus;
    
    const remainingCalories = Math.max(0, adjustedTargetCalories - dailyData.consumedCalories);

    return {
      targetCalories: adjustedTargetCalories,
      consumedCalories: dailyData.consumedCalories,
      remainingCalories,
      protein: {
        consumed: dailyData.consumedProtein,
        target: onboardingData?.protein_grams || 0,
      },
      carbs: {
        consumed: dailyData.consumedCarbs,
        target: onboardingData?.carbs_grams || 0,
      },
      fats: {
        consumed: dailyData.consumedFats,
        target: onboardingData?.fats_grams || 0,
      },
      fiber: {
        consumed: dailyData.consumedFiber,
        target: 38,
      },
      sugar: {
        consumed: dailyData.consumedSugar,
        target: 50,
      },
      sodium: {
        consumed: dailyData.consumedSodium,
        target: 2300, 
      },
      healthScore: dailyData.healthScore,
      water: {
        consumed: dailyData.waterTotal,
        target: dailyData.waterGoal || 0,
      },
      burnedCalories: burnedCaloriesBonus,
      rolloverCalories: rolloverBonus,
    };
  }, [
    onboardingData?.target_calories,
    onboardingData?.protein_grams,
    onboardingData?.carbs_grams,
    onboardingData?.fats_grams,
    dailyData.consumedCalories,
    dailyData.consumedProtein,
    dailyData.consumedCarbs,
    dailyData.consumedFats,
    dailyData.consumedFiber,
    dailyData.consumedSugar,
    dailyData.consumedSodium,
    dailyData.healthScore,
    dailyData.waterTotal,
    dailyData.waterGoal,
    settings.burnedCalories,
    settings.calorieRollover,
    burnedCalories,
    rolloverCalories,
  ]);

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <LottieLoader size="large" />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Загрузка данных...</Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]} edges={["top"]}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: themeColors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <HomeHeader streak={streakCount} />

        <WeekCalendar 
          selectedDate={selectedDate} 
          onDateSelect={handleDateSelect} 
          achievedDates={weekAchievements}
          dailyProgress={dailyProgress}
        />

        {dailyLoading && !dataCache.hasDailyMeals(getLocalDayRange(selectedDateTimestamp).dateStr) ? (
          <NutritionCardSkeleton />
        ) : (
          <CardsPager stats={stats} onAddWater={handleAddWater} />
        )}

        {dailyError ? (
          <TouchableOpacity style={[styles.errorBox, { backgroundColor: isDark ? themeColors.card : "#FFF3F3" }]} onPress={() => loadDailyData(selectedDateTimestamp)}>
            <Text style={styles.errorText}>{dailyError}</Text>
            <Text style={[styles.errorLink, { color: themeColors.primary }]}>Повторить</Text>
          </TouchableOpacity>
        ) : null}

        <RecentMeals
          meals={recentMeals}
          loading={dailyLoading && recentMeals.length === 0}
          error={dailyError}
          onRetry={() => loadDailyData(selectedDateTimestamp, true)}
          onAddPress={isTodaySelected ? handleScanFood : undefined}
          onLoadMore={undefined}
          onMealPress={handleMealPress}
        />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  loadingBlock: {
    marginTop: 12,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFF0",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  errorBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F2C2C2",
    gap: 6,
  },
  errorText: {
    fontSize: 14,
    color: "#C62828",
    fontFamily: "Inter_600SemiBold",
  },
  errorLink: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140, 
  },
  section: {
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
