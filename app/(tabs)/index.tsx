import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CaloriesCard } from "../../components/home/CaloriesCard";
import { HomeHeader } from "../../components/home/HomeHeader";
import { MacrosCards } from "../../components/home/MacrosCards";
import { RecentMeals } from "../../components/home/RecentMeals";
import { WeekCalendar } from "../../components/home/WeekCalendar";
import { colors } from "../../constants/theme";
import { useFonts } from "../../hooks/use-fonts";
import { apiService, MealPhoto } from "../../services/api";

const TASHKENT_TIMEZONE = "Asia/Tashkent";
const TASHKENT_OFFSET_MINUTES = 300; 
const TASHKENT_OFFSET_MS = TASHKENT_OFFSET_MINUTES * 60 * 1000;

const parseMealDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const hasTz = /[+-]\d\d:\d\d$/.test(value) || value.endsWith("Z");
  const normalized = hasTz ? value : `${value}Z`;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
};

const getTashkentDayRange = (timestampUtcMs: number = Date.now()) => {
  const tzMs = timestampUtcMs + TASHKENT_OFFSET_MS;
  const tzDate = new Date(tzMs);
  tzDate.setHours(0, 0, 0, 0);
  const startUtcMs = tzDate.getTime() - TASHKENT_OFFSET_MS;
  const endUtcMs = startUtcMs + 24 * 60 * 60 * 1000;
  const dateStr = `${tzDate.getFullYear()}-${String(tzDate.getMonth() + 1).padStart(2, "0")}-${String(tzDate.getDate()).padStart(2, "0")}`;
  return { startUtcMs, endUtcMs, dateStr };
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
  const d = new Date(dateUtcMs + TASHKENT_OFFSET_MS);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d.getTime() - TASHKENT_OFFSET_MS;
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
  const [selectedDateTimestamp, setSelectedDateTimestamp] = useState<number>(getTashkentDayRange().startUtcMs);
  const [weekAchievements, setWeekAchievements] = useState<Record<string, boolean>>({});
  const [streakCount, setStreakCount] = useState(0);
  const [weekStartTs, setWeekStartTs] = useState<number>(getWeekStartTimestamp(getTashkentDayRange().startUtcMs));
  const weekLoadInProgress = useRef(false);
  const lastWeekLoadedRef = useRef<number | null>(null);
  const todayTs = useMemo(() => getTashkentDayRange().startUtcMs, []);
  const isTodaySelected = selectedDateTimestamp === todayTs;
  
  const [fabExpanded, setFabExpanded] = useState(false);
  const fabAnimation = useRef(new Animated.Value(0)).current;
  
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
const fetchLatestMeals = useCallback(async (opts?: { append?: boolean; limit?: number; force?: boolean }) => {
    try {
    if (!opts?.force && recentLoading) return;
      const limit = opts?.limit ?? recentLimit;
      const skip = opts?.append ? recentSkip : 0;
      setRecentLoading(true);
      setRecentError(null);
      const meals = await apiService.getMealPhotos(skip, limit);
      if (!isMountedRef.current) return;

      const { startUtcMs, endUtcMs } = getTashkentDayRange(selectedDateTimestamp);

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
          ? created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: TASHKENT_TIMEZONE })
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

  useEffect(() => {
    if (params?.refresh) {
      hasLoadedRef.current = false;
      lastLoadedDateRef.current = null;
      loadUserData();
      loadDailyData(selectedDateTimestamp, true);
      fetchLatestMeals({ append: false, limit: recentLimit, force: true });
    }
  }, [params?.refresh]);

  const handleDateSelect = useMemo(() => (date: Date) => {
    const utcMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const { startUtcMs } = getTashkentDayRange(utcMs);
    if (startUtcMs !== selectedDateTimestamp) {
      setSelectedDateTimestamp(startUtcMs);
    }
  }, [selectedDateTimestamp]);

  const selectedDate = useMemo(() => {
    return new Date(selectedDateTimestamp + TASHKENT_OFFSET_MS);
  }, [selectedDateTimestamp]);

  const toggleFab = () => {
    const toValue = fabExpanded ? 0 : 1;
    setFabExpanded(!fabExpanded);
    
    Animated.spring(fabAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const handleScanFood = async () => {
    if (!isTodaySelected) {
      Alert.alert("Доступно только сегодня", "Добавлять можно только в текущий день.");
      if (fabExpanded) toggleFab();
      return;
    }
    toggleFab();
    
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
      if (fabExpanded) toggleFab();
      return;
    }
    toggleFab();
    router.push("/add-manual" as any);
  };

  const handleAddWater = () => {
    if (!isTodaySelected) {
      Alert.alert("Доступно только сегодня", "Добавлять можно только в текущий день.");
      if (fabExpanded) toggleFab();
      return;
    }
    toggleFab();
    router.push("/add-water" as any);
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
        const results = await apiService.getDailyMealsBatch(dates, TASHKENT_OFFSET_MINUTES);
        const map: Record<string, boolean> = {};
        results.forEach((r) => {
          map[r.date] = r.total_calories >= onboardingData.target_calories;
        });
        setWeekAchievements(map);
        
        lastWeekLoadedRef.current = weekTs;
      } catch (e) {
        console.warn("Week achievements failed", e);
      } finally {
        weekLoadInProgress.current = false;
      }
    },
    [onboardingData?.target_calories]
  );

  const loadDailyData = useCallback(async (dateTimestamp: number, force: boolean = false) => {
    if (!force && lastLoadedDateRef.current === dateTimestamp) {
      return;
    }
    lastLoadedDateRef.current = dateTimestamp;
    
    try {
      setDailyLoading(true);
      setDailyError(null);

      const { dateStr } = getTashkentDayRange(dateTimestamp);

      const data = await apiService.getDailyMeals(
        dateStr,
        TASHKENT_OFFSET_MINUTES
      );
      const water = await apiService.getDailyWater(
        dateStr,
        TASHKENT_OFFSET_MINUTES
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
      setStreakCount(data.streak_count ?? 0);
      
      const key = dateStr;
      setWeekAchievements((prev) => {
        const next = { ...prev, [key]: data.total_calories >= (onboardingData?.target_calories || 0) };
        return next;
      });
      loadWeekAchievements(new Date(dateTimestamp));
    } catch (error: any) {
      if (isMountedRef.current) {
        console.error("Error loading daily data:", error);
        setDailyError("Не удалось загрузить данные за день");
        setDailyData({
          consumedCalories: 0,
          consumedProtein: 0,
          consumedCarbs: 0,
          consumedFats: 0,
          waterTotal: 0,
          waterGoal: 0,
          meals: [],
        });
      }
    }
    finally {
      setDailyLoading(false);
    }
  }, [onboardingData?.target_calories, loadWeekAchievements]);

  useFocusEffect(
    useCallback(() => {
      fetchLatestMeals();
      
      loadDailyData(selectedDateTimestamp, true);
      loadWeekAchievements(new Date(selectedDateTimestamp));
    }, [fetchLatestMeals, loadDailyData, loadWeekAchievements, selectedDateTimestamp])
  );

  useEffect(() => {
    if (selectedDateTimestamp === lastLoadedDateRef.current) {
      return;
    }
    
    loadDailyData(selectedDateTimestamp);
    const weekTs = getWeekStartTimestamp(selectedDateTimestamp);
    if (weekTs !== weekStartTs) {
      setWeekStartTs(weekTs);
      loadWeekAchievements(new Date(selectedDateTimestamp));
    } else {
        
        if (lastWeekLoadedRef.current !== weekStartTs) {
          loadWeekAchievements(new Date(selectedDateTimestamp));
        }
    }
  }, [selectedDateTimestamp, weekStartTs, loadWeekAchievements]);

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

  const fabBottom = 20; 

  const button1TranslateY = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40], 
  });
  const button1TranslateX = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const button2TranslateY = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -104], 
  });
  const button2TranslateX = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const button3TranslateY = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -168], 
  });
  const button3TranslateX = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const blurOpacity = fabAnimation.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
  });

  const buttonOpacity = fabAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const fabRotation = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

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
        />

        {dailyLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Загружаем данные за день...</Text>
          </View>
        ) : (
          <>
            <CaloriesCard 
              consumedCalories={stats.consumedCalories}
              targetCalories={stats.targetCalories}
            />

            <MacrosCards 
              protein={stats.protein}
              carbs={stats.carbs}
              fats={stats.fats}
              water={stats.water}
            />
          </>
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
        />
      </ScrollView>

      {fabExpanded && (
        <TouchableOpacity
          style={styles.blurBackdrop}
          activeOpacity={1}
          onPress={toggleFab}
        >
          <Animated.View
            style={[
              styles.blurContainer,
              {
                opacity: blurOpacity,
              },
            ]}
          >
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
          </Animated.View>
        </TouchableOpacity>
      )}

      <Animated.View
        style={[
          styles.fabSubButtonContainer,
          {
            bottom: fabBottom + 64 - 2, 
            opacity: buttonOpacity,
            transform: [
              { translateY: button1TranslateY },
              { translateX: button1TranslateX },
            ],
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.fabSubButtonTextContainer}
          onPress={handleScanFood}
          activeOpacity={0.7}
        >
          <Text style={styles.fabSubButtonText}>Сканировать еду</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.fabSubButtonIconContainer}
          onPress={handleScanFood}
          activeOpacity={0.7}
        >
          <Ionicons name="scan-circle-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.fabSubButtonContainer,
          {
            bottom: fabBottom + 64 - 8,
            opacity: buttonOpacity,
            transform: [
              { translateY: button2TranslateY },
              { translateX: button2TranslateX },
            ],
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.fabSubButtonTextContainer}
          onPress={handleAddManually}
          activeOpacity={0.7}
        >
          <Text style={styles.fabSubButtonText}>Добавить вручную</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.fabSubButtonIconContainer}
          onPress={handleAddManually}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.fabSubButtonContainer,
          {
            bottom: fabBottom + 64 - 8,
            opacity: buttonOpacity,
            transform: [
              { translateY: button3TranslateY },
              { translateX: button3TranslateX },
            ],
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.fabSubButtonTextContainer}
          onPress={handleAddWater}
          activeOpacity={0.7}
        >
          <Text style={styles.fabSubButtonText}>Вода</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.fabSubButtonIconContainer}
          onPress={handleAddWater}
          activeOpacity={0.7}
        >
          <Ionicons name="water-outline" size={24} color="#1E90FF" />
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity 
        style={[
          styles.fab, 
          { bottom: fabBottom }
        ]}
        onPress={toggleFab}
        activeOpacity={0.8}
      >
        <Animated.View
          style={{
            transform: [{ rotate: fabRotation }],
          }}
        >
          <Ionicons 
            name={fabExpanded ? "close" : "add"} 
            size={32} 
            color="#FFFFFF" 
          />
        </Animated.View>
      </TouchableOpacity>
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
    paddingBottom: 120, 
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
  blurBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  fab: {
    position: "absolute",
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  fabSubButtonContainer: {
    position: "absolute",
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 9,
  },
  fabSubButtonTextContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  fabSubButtonIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  fabSubButtonText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#1A1A1A",
    letterSpacing: -0.2,
  },
});
