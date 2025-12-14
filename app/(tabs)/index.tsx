import { useFocusEffect } from "@react-navigation/native";
import { useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { colors } from "../../constants/theme";
import { useFonts } from "../../hooks/use-fonts";
import { apiService, MealPhoto } from "../../services/api";

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
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [recentLimit, setRecentLimit] = useState(10);
  const [recentHasMore, setRecentHasMore] = useState(true);
  const [recentSkip, setRecentSkip] = useState(0);
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
  const [latestMeal, setLatestMeal] = useState<MealPhoto | null>(null);
  const lastFocusRefreshAtRef = useRef(0);

  const fetchLatestMeals = useCallback(async (opts?: { append?: boolean; limit?: number; force?: boolean }) => {
    try {
    if (!opts?.force && recentLoading) return;
      const limit = opts?.limit ?? recentLimit;
      const skip = opts?.append ? recentSkip : 0;
      setRecentLoading(true);
      setRecentError(null);
      const ttlMs = opts?.force ? 0 : 60000;
      const meals = await apiService.getMealPhotosCached(skip, limit, ttlMs);
      if (!isMountedRef.current) return;

      const { startUtcMs, endUtcMs } = getLocalDayRange(selectedDateTimestamp);

      const mealsForSelectedDay = meals.filter((m) => {
        const created = parseMealDate((m as any).created_at);
        if (!created) return false;
        const createdMs = created.getTime();
        return createdMs >= startUtcMs && createdMs < endUtcMs;
      });

      setLatestMeal((opts?.append ? mealsForSelectedDay : mealsForSelectedDay)[0] || null);
      const token = apiService.getCachedToken() || undefined;
      const mappedMeals = mealsForSelectedDay.map((m) => {
        const created = parseMealDate((m as any).created_at);
        const time = created
          ? created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "";
        const imageUrl =
          m.mime_type === "manual" || !m.file_path
            ? undefined
            : apiService.getMealPhotoUrl(m.id, token);
        return {
          id: m.id,
          name: m.detected_meal_name || m.meal_name || "Блюдо",
          time,
          calories: m.calories ?? 0,
          protein: m.protein ?? 0,
          carbs: m.carbs ?? 0,
          fats: m.fat ?? 0,
          isManual: m.mime_type === "manual",
          imageUrl,
        };
      });
      const filtered = mappedMeals.filter(
        (meal) =>
          (meal.calories ?? 0) > 0 ||
          (meal.protein ?? 0) > 0 ||
          (meal.carbs ?? 0) > 0 ||
          (meal.fats ?? 0) > 0
      );
      setRecentMeals(filtered);
      setRecentHasMore(mealsForSelectedDay.length >= limit);
      setRecentSkip(skip + limit);
    } catch (err) {
      console.warn("Failed to load latest meal", err);
      setRecentError("Не удалось загрузить последние блюда");
    }
    finally {
      setRecentLoading(false);
    }
  }, [recentLimit, selectedDateTimestamp]);

  const loadUserData = useCallback(async () => {
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
      const mealsPromise = fetchLatestMeals().catch(() => null);

      const [user, onboarding] = await Promise.all([userPromise, onboardingPromise, mealsPromise]);
      if (!isMountedRef.current) return;
      setUserData(user);
      if (onboarding) {
        setOnboardingData(onboarding);
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        console.error("Error loading data:", error);
      }
      hasLoadedRef.current = false;
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

  useEffect(() => {
    if (!hasInitializedRecentRef.current) {
      hasInitializedRecentRef.current = true;
      return;
    }
    fetchLatestMeals({ append: false, limit: recentLimit, force: true });
  }, [fetchLatestMeals, recentLimit, selectedDateTimestamp]);

  const loadDailyData = useCallback(async (dateTimestamp: number, force: boolean = false) => {
    if (!force && lastLoadedDateRef.current === dateTimestamp) {
      return;
    }
    lastLoadedDateRef.current = dateTimestamp;
    
    try {
      setDailyLoading(true);
      setDailyError(null);

      const { dateStr } = getLocalDayRange(dateTimestamp);

      const data = await apiService.getDailyMeals(
        dateStr,
        getLocalTimezoneOffset()
      );
      const water = await apiService.getDailyWater(
        dateStr,
        getLocalTimezoneOffset()
      );

      if (!isMountedRef.current) return;
      setDailyData({
        consumedCalories: data.total_calories,
        consumedProtein: data.total_protein,
        consumedCarbs: data.total_carbs,
        consumedFats: data.total_fat,
        waterTotal: water.total_ml,
        waterGoal: water.goal_ml || 0,
        meals: data.meals,
      });
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
    } catch (err: any) {
      console.warn("Daily data load error", err);
      if (!isMountedRef.current) return;
      setDailyError(err?.response?.data?.detail || err?.message || "Ошибка загрузки данных");
    } finally {
      if (isMountedRef.current) {
        setDailyLoading(false);
      }
    }
  }, [onboardingData?.target_calories, onboardingData?.target_protein, onboardingData?.target_carbs, onboardingData?.target_fat]);

  useEffect(() => {
    if (params?.refresh) {
      loadDailyData(selectedDateTimestamp, true);
      fetchLatestMeals({ append: false, limit: recentLimit });
    }
  }, [params?.refresh, fetchLatestMeals, loadDailyData, recentLimit, selectedDateTimestamp]);

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

  const handleScanFood = async () => {
    if (!isTodaySelected) {
      Alert.alert("Доступно только сегодня", "Добавлять можно только в текущий день.");
      return;
    }
    
    if (cameraPermission && !cameraPermission.granted) {
      if (cameraPermission.canAskAgain) {
        const result = await requestCameraPermission();
        if (result.granted) {
          router.push("/scan-meal" as any);
        } else {
          Alert.alert(
            "Разрешение камеры",
            "Для сканирования еды необходимо разрешение на использование камеры. Пожалуйста, разрешите доступ в настройках приложения.",
            [{ text: "ОК" }]
          );
        }
      } else {
        Alert.alert(
          "Разрешение камеры",
          "Для сканирования еды необходимо разрешение на использование камеры. Пожалуйста, разрешите доступ в настройках приложения.",
          [{ text: "ОК" }]
        );
      }
    } else {
      router.push("/scan-meal" as any);
    }
  };

  const handleAddManually = () => {
    if (!isTodaySelected) {
      Alert.alert("Доступно только сегодня", "Добавлять можно только в текущий день.");
      return;
    }
    router.push("/add-manual" as any);
  };

  const handleAddWater = () => {
    if (!isTodaySelected) {
      Alert.alert("Доступно только сегодня", "Добавлять можно только в текущий день.");
      return;
    }
    router.push("/add-water" as any);
  };

  const handleMealPress = (meal: {
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
  };

  const loadWeekAchievements = useCallback(
    async (baseDate: Date) => {
      if (!onboardingData?.target_calories) {
        setWeekAchievements({});
        setStreakCount(0);
        return;
      }
      const weekTs = getWeekStartTimestamp(baseDate.getTime());
      if (weekLoadInProgress.current) return;
      if (lastWeekLoadedRef.current === weekTs) return;
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
        
        setWeekAchievements(achievementsMap);
        setDailyProgress((prev) => ({
          ...prev,
          ...progressMap,
        }));
        
        lastWeekLoadedRef.current = weekTs;
      } catch (e) {
        console.warn("Week achievements failed", e);
      } finally {
        weekLoadInProgress.current = false;
      }
    },
    [onboardingData?.target_calories]
  );

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFocusRefreshAtRef.current < 15000) return;
      lastFocusRefreshAtRef.current = now;
      fetchLatestMeals();
    }, [fetchLatestMeals])
  );

  useEffect(() => {
    loadDailyData(selectedDateTimestamp);
    loadWeekAchievements(new Date(selectedDateTimestamp));
  }, [selectedDateTimestamp, loadDailyData, loadWeekAchievements]);

  const handleRefresh = async () => {
    setRefreshing(true);
    hasLoadedRef.current = false;
    lastLoadedDateRef.current = null;
    try {
      await loadUserData();
      await loadDailyData(selectedDateTimestamp);
      await fetchLatestMeals({ append: false, limit: recentLimit });
    } catch (err) {
      console.warn("Refresh error", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    const pageSize = 10;
    setRecentLimit(pageSize);
    await fetchLatestMeals({ append: true, limit: pageSize });
  };

  const stats = useMemo(() => {
    const targetCalories = onboardingData?.target_calories || 0;
    const remainingCalories = Math.max(0, targetCalories - dailyData.consumedCalories);

    return {
      targetCalories,
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
      water: {
        consumed: dailyData.waterTotal,
        target: dailyData.waterGoal || 0,
      },
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
    dailyData.waterTotal,
    dailyData.waterGoal,
  ]);

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Загрузка данных...</Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
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

        {dailyLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Загружаем данные за день...</Text>
          </View>
        ) : (
          <CardsPager stats={stats} onAddWater={handleAddWater} />
        )}

        {dailyError ? (
          <TouchableOpacity style={styles.errorBox} onPress={() => loadDailyData(selectedDateTimestamp)}>
            <Text style={styles.errorText}>{dailyError}</Text>
            <Text style={styles.errorLink}>Повторить</Text>
          </TouchableOpacity>
        ) : null}

        <RecentMeals
          meals={recentMeals}
          loading={recentLoading}
          error={recentError}
          onRetry={() => fetchLatestMeals({ append: false, limit: recentLimit })}
          onAddPress={isTodaySelected ? handleScanFood : undefined}
          onLoadMore={recentHasMore ? handleLoadMore : undefined}
          onMealPress={handleMealPress}
        />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.secondary,
    fontFamily: "Inter_400Regular",
  },
  loadingBlock: {
    marginTop: 12,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFF3F3",
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
    color: colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140, 
  },
  section: {
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },
});
