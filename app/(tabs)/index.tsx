import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CaloriesCard } from "../../components/home/CaloriesCard";
import { HomeHeader } from "../../components/home/HomeHeader";
import { MacrosCards } from "../../components/home/MacrosCards";
import { RecentMeals } from "../../components/home/RecentMeals";
import { WeekCalendar } from "../../components/home/WeekCalendar";
import { colors } from "../../constants/theme";
import { useFonts } from "../../hooks/use-fonts";
import { apiService } from "../../services/api";

/**
 * Главный экран приложения
 */
export default function HomeScreen() {
  const fontsLoaded = useFonts();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  
  // Автоматически выбираем сегодняшнюю дату (используем строку для стабильности)
  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime(); // Используем timestamp для сравнения
  };
  const [selectedDateTimestamp, setSelectedDateTimestamp] = useState<number>(getToday);
  
  // Данные по выбранной дате
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

  // Используем ref для предотвращения дублирования запросов
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);
  const lastLoadedDateRef = useRef<number | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    loadUserData();
    
    return () => {
      isMountedRef.current = false;
      isLoadingRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Предотвращаем загрузку той же даты повторно
    if (selectedDateTimestamp === lastLoadedDateRef.current) {
      return;
    }
    
    loadDailyData(selectedDateTimestamp);
  }, [selectedDateTimestamp]);

  const loadUserData = async () => {
    // Предотвращаем параллельные вызовы
    if (isLoadingRef.current) {
      return;
    }
    
    // Проверяем что компонент еще смонтирован
    if (!isMountedRef.current) {
      return;
    }
    
    isLoadingRef.current = true;
    
    try {
      // Загружаем данные пользователя
      const user = await apiService.getCurrentUser();
      if (!isMountedRef.current) return;
      setUserData(user);

      // Загружаем данные онбординга
      try {
        const onboarding = await apiService.getOnboardingData();
        if (!isMountedRef.current) return;
        setOnboardingData(onboarding);
      } catch (err) {
        // Нет данных онбординга - это нормально
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        console.error("Error loading data:", error);
      }
    } finally {
      isLoadingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const loadDailyData = async (dateTimestamp: number) => {
    // Предотвращаем параллельные вызовы для той же даты
    if (lastLoadedDateRef.current === dateTimestamp) {
      return;
    }
    
    lastLoadedDateRef.current = dateTimestamp;
    
    try {
      // TODO: Загружать данные из БД по выбранной дате
      // const date = new Date(dateTimestamp);
      // const dateStr = date.toISOString().split('T')[0];
      // const data = await apiService.getDailyData(dateStr);
      
      // Пока используем заглушку
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

  // Мемоизируем преобразование timestamp обратно в Date для календаря
  const selectedDate = useMemo(() => new Date(selectedDateTimestamp), [selectedDateTimestamp]);

  // Мемоизируем статистику из данных онбординга и дневных данных
  // ВАЖНО: Все хуки должны быть ВЫШЕ условного return!
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

  // Условный return должен быть ПОСЛЕ всех хуков
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

        <RecentMeals meals={dailyData.meals} />
      </ScrollView>

      {/* Floating Add Button - чуть выше нижней панели */}
      {/* Tab bar height = 80 (из _layout.tsx: height: 80) + SafeArea bottom */}
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
    paddingBottom: 110, // Увеличено для FAB и нижней панели
  },
  fab: {
    position: "absolute",
    bottom: 78, // Чуть выше нижней панели: tab bar (75) + небольшой отступ (3)
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
    zIndex: 10,
  },
});
