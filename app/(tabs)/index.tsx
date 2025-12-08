import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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
/**
 * Главный экран приложения
 */
export default function HomeScreen() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  
  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime(); 
  };
  const [selectedDateTimestamp, setSelectedDateTimestamp] = useState<number>(getToday);
  
  const [fabExpanded, setFabExpanded] = useState(false);
  const fabAnimation = useRef(new Animated.Value(0)).current;
  
  const [dailyData, setDailyData] = useState({
    consumedCalories: 0,
    consumedProtein: 0,
    consumedCarbs: 0,
    consumedFats: 0,
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
  const [latestMeal, setLatestMeal] = useState<MealPhoto | null>(null);

  const recentMealsData = useMemo(() => {
    const baseMeals = dailyData.meals ?? [];
    if (!latestMeal) return baseMeals;
    const created = latestMeal.created_at ? new Date(latestMeal.created_at) : null;
    const time = created
      ? created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";
    return [
      {
        id: latestMeal.id,
        name: latestMeal.detected_meal_name || latestMeal.meal_name || "Блюдо",
        time,
        calories: latestMeal.calories ?? 0,
        protein: latestMeal.protein ?? 0,
        carbs: latestMeal.carbs ?? 0,
        fats: latestMeal.fat ?? 0,
      },
      ...baseMeals,
    ];
  }, [latestMeal, dailyData.meals]);

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
      const user = await apiService.getCurrentUser();
      if (!isMountedRef.current) return;
      setUserData(user);

      try {
        const onboarding = await apiService.getOnboardingData();
        if (!isMountedRef.current) return;
        setOnboardingData(onboarding);
      } catch (err) {
      }
      try {
        const meals = await apiService.getMealPhotos(0, 1);
        if (!isMountedRef.current) return;
        setLatestMeal(meals[0] || null);
      } catch (err) {
        console.warn("Failed to load latest meal", err);
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

  // Запрос разрешения камеры при первом входе
  useEffect(() => {
    const requestCameraPermissionOnFirstLaunch = async () => {
      try {
        if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
          // Автоматически запрашиваем разрешение при первом входе
          await requestCameraPermission();
        }
      } catch (error) {
        console.error("Error requesting camera permission:", error);
      }
    };

    requestCameraPermissionOnFirstLaunch();
  }, [cameraPermission]); 

  useEffect(() => {
    if (selectedDateTimestamp === lastLoadedDateRef.current) {
      return;
    }
    
    loadDailyData(selectedDateTimestamp);
  }, [selectedDateTimestamp]);

  const loadDailyData = async (dateTimestamp: number) => {
    if (lastLoadedDateRef.current === dateTimestamp) {
      return;
    }
    
    lastLoadedDateRef.current = dateTimestamp;
    
    try {
      
      if (!isMountedRef.current) return;
      setDailyData({
        consumedCalories: 0,
        consumedProtein: 0,
        consumedCarbs: 0,
        consumedFats: 0,
        meals: [],
      });
    } catch (error: any) {
      if (isMountedRef.current) {
        console.error("Error loading daily data:", error);
      }
    }
  };

  const handleDateSelect = useMemo(() => (date: Date) => {
    const timestamp = date.getTime();
    if (timestamp !== selectedDateTimestamp) {
      setSelectedDateTimestamp(timestamp);
    }
  }, [selectedDateTimestamp]);

  const selectedDate = useMemo(() => new Date(selectedDateTimestamp), [selectedDateTimestamp]);

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
    toggleFab();
    
    // Проверяем разрешение камеры перед переходом
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
    console.log("Добавить вручную");
    toggleFab();
    // TODO: Navigate to manual add screen
  };

  const handleAddWater = () => {
    console.log("Вода");
    toggleFab();
    // TODO: Navigate to water screen or show modal
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

  const fabBottom = 20; // Same for both iOS and Android

  // Анимация для подкнопок - одинаковые отступы 12px, ближе к главной кнопке
  // Высота иконки 52px, расстояние между кнопками 12px
  const button1TranslateY = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40], // Ближе к главной кнопке (меньше поднимаем)
  });
  const button1TranslateX = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const button2TranslateY = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -104], // 40 + 12 (отступ) + 52 (высота) = 104px
  });
  const button2TranslateX = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const button3TranslateY = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -168], // 104 + 12 (отступ) + 52 (высота) = 168px
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
      >
        <HomeHeader />

        <WeekCalendar 
          selectedDate={selectedDate} 
          onDateSelect={handleDateSelect} 
        />

        <CaloriesCard remainingCalories={stats.remainingCalories} />

        <MacrosCards 
          protein={stats.protein}
          carbs={stats.carbs}
          fats={stats.fats}
        />

        <RecentMeals meals={recentMealsData} />
      </ScrollView>

      {/* Размытый фон */}
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

      {/* Сканировать еду */}
      <Animated.View
        style={[
          styles.fabSubButtonContainer,
          {
            bottom: fabBottom + 64 - 2, // 2px отступ от верха главной кнопки (ближе к плюсику)
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

      {/* Добавить вручную */}
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

      {/* Вода */}
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

      {/* Main FAB */}
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
