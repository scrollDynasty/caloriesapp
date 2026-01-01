import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { HealthPermissionStatus, healthService } from "../services/health";

// Ключи хранилища
const APP_SETTINGS_KEY = "@caloriesapp:app_settings";
const BURNED_CALORIES_KEY = "@caloriesapp:burned_calories";
const CALORIE_ROLLOVER_KEY = "@caloriesapp:calorie_rollover";
const FEATURE_STATUS_KEY = "@caloriesapp:feature_status";

/**
 * Интерфейс настроек приложения
 */
export interface AppSettings {
  badgeCelebrations: boolean;     // Показывать анимацию при получении значков
  liveActivity: boolean;          // Живая активность (iOS Dynamic Island)
  burnedCalories: boolean;        // Добавлять сожжённые калории к норме
  calorieRollover: boolean;       // Переносить калории с предыдущего дня
  autoMacroAdjust: boolean;       // Авто-корректировка макроэлементов
}

/**
 * Статус доступности функций
 */
export interface FeatureStatus {
  healthAvailable: boolean;       // Health (iOS/Android) доступен
  healthAuthorized: boolean;      // Есть разрешение на чтение данных
  liveActivityAvailable: boolean; // Live Activity доступен (iOS 16+)
  lastChecked: string;            // Последняя проверка
}

/**
 * Данные о сожжённых калориях за день
 */
export interface BurnedCaloriesData {
  date: string;           // YYYY-MM-DD
  activeCalories: number; // Активные калории (тренировки)
  restingCalories: number; // Базовые калории
  totalCalories: number;   // Всего сожжено
  steps: number;           // Шаги
  distance?: number;       // Дистанция в метрах
  flightsClimbed?: number; // Этажи
  lastUpdated: string;     // ISO timestamp
}

/**
 * Данные о переносе калорий
 */
export interface CalorieRolloverData {
  fromDate: string;       // Дата, с которой перенесено
  toDate: string;         // Дата, на которую перенесено
  amount: number;         // Количество перенесённых калорий (макс 200)
  used: boolean;          // Уже использовано
}

interface AppSettingsContextType {
  settings: AppSettings;
  featureStatus: FeatureStatus;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  
  // Health интеграция
  healthStatus: HealthPermissionStatus | null;
  requestHealthPermission: () => Promise<boolean>;
  disconnectHealth: () => Promise<void>;
  
  // Сожжённые калории
  burnedCalories: BurnedCaloriesData | null;
  refreshBurnedCalories: () => Promise<void>;
  getBurnedCaloriesForDate: (dateStr: string) => Promise<BurnedCaloriesData | null>;
  
  // Перенос калорий
  rolloverCalories: CalorieRolloverData | null;
  calculateRollover: (yesterdayConsumed: number, yesterdayTarget: number) => number;
  getRolloverForDate: (dateStr: string) => Promise<CalorieRolloverData | null>;
  
  // Авто-корректировка макросов
  calculateAdjustedMacros: (
    targetCalories: number,
    weight: number,
    goal: "lose" | "maintain" | "gain"
  ) => { protein: number; carbs: number; fats: number };
  
  // Проверка достижений для анимации
  shouldShowBadgeCelebration: () => boolean;
  markBadgeCelebrationShown: () => void;
  pendingBadgeCelebration: string | null;
  setPendingBadgeCelebration: (badge: string | null) => void;
  
  // Проверка доступности функций
  checkFeatureAvailability: () => Promise<void>;
  
  isLoaded: boolean;
}

const defaultSettings: AppSettings = {
  badgeCelebrations: true,
  liveActivity: false,
  burnedCalories: false,
  calorieRollover: false,
  autoMacroAdjust: true,
};

const defaultFeatureStatus: FeatureStatus = {
  healthAvailable: false,
  healthAuthorized: false,
  liveActivityAvailable: false,
  lastChecked: "",
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [featureStatus, setFeatureStatus] = useState<FeatureStatus>(defaultFeatureStatus);
  const [healthStatus, setHealthStatus] = useState<HealthPermissionStatus | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [burnedCalories, setBurnedCalories] = useState<BurnedCaloriesData | null>(null);
  const [rolloverCalories, setRolloverCalories] = useState<CalorieRolloverData | null>(null);
  const [pendingBadgeCelebration, setPendingBadgeCelebration] = useState<string | null>(null);
  const [badgeCelebrationShown, setBadgeCelebrationShown] = useState(false);

  // Загрузка настроек при инициализации
  useEffect(() => {
    initializeSettings();
  }, []);

  const hasRefreshedBurnedCaloriesRef = React.useRef(false);
  useEffect(() => {
    if (settings.burnedCalories && isLoaded && featureStatus.healthAuthorized && !hasRefreshedBurnedCaloriesRef.current) {
      hasRefreshedBurnedCaloriesRef.current = true;
      refreshBurnedCalories();
    }
    // Сбрасываем флаг при отключении
    if (!settings.burnedCalories) {
      hasRefreshedBurnedCaloriesRef.current = false;
    }
  }, [settings.burnedCalories, isLoaded, featureStatus.healthAuthorized]);

  // Загрузка данных о переносе калорий
  useEffect(() => {
    if (settings.calorieRollover && isLoaded) {
      loadRolloverData();
    }
  }, [settings.calorieRollover, isLoaded]);

  /**
   * Инициализация настроек и проверка доступности функций
   */
  const initializeSettings = async () => {
    try {
      // Загружаем настройки
      const storedSettings = await AsyncStorage.getItem(APP_SETTINGS_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }

      // Загружаем статус функций
      const storedStatus = await AsyncStorage.getItem(FEATURE_STATUS_KEY);
      if (storedStatus) {
        setFeatureStatus(JSON.parse(storedStatus));
      }

      // Инициализируем Health Service
      const status = await healthService.initialize();
      setHealthStatus(status);

      // Обновляем статус функций
      const newFeatureStatus: FeatureStatus = {
        healthAvailable: status.isAvailable,
        healthAuthorized: status.isAuthorized,
        liveActivityAvailable: Platform.OS === "ios" && parseInt(Platform.Version as string, 10) >= 16,
        lastChecked: new Date().toISOString(),
      };

      setFeatureStatus(newFeatureStatus);
      await AsyncStorage.setItem(FEATURE_STATUS_KEY, JSON.stringify(newFeatureStatus));

      // Автоматически отключаем функции, которые недоступны
      await validateAndDisableUnavailableFeatures(storedSettings ? JSON.parse(storedSettings) : defaultSettings, newFeatureStatus);
    } catch (error) {
      console.error("Error initializing app settings:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  /**
   * Проверка и отключение недоступных функций
   */
  const validateAndDisableUnavailableFeatures = async (
    currentSettings: AppSettings,
    status: FeatureStatus
  ) => {
    let needsUpdate = false;
    const updatedSettings = { ...currentSettings };

    // Отключаем burnedCalories если Health недоступен или не авторизован
    if (currentSettings.burnedCalories && !status.healthAuthorized) {
      updatedSettings.burnedCalories = false;
      needsUpdate = true;
    }

    // Отключаем liveActivity если недоступен
    if (currentSettings.liveActivity && !status.liveActivityAvailable) {
      updatedSettings.liveActivity = false;
      needsUpdate = true;
    }

    if (needsUpdate) {
      setSettings(updatedSettings);
      await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(updatedSettings));
    }
  };

  /**
   * Проверка доступности функций
   */
  const checkFeatureAvailability = async () => {
    try {
      const status = await healthService.initialize();
      setHealthStatus(status);

      const newFeatureStatus: FeatureStatus = {
        healthAvailable: status.isAvailable,
        healthAuthorized: status.isAuthorized,
        liveActivityAvailable: Platform.OS === "ios" && parseInt(Platform.Version as string, 10) >= 16,
        lastChecked: new Date().toISOString(),
      };

      setFeatureStatus(newFeatureStatus);
      await AsyncStorage.setItem(FEATURE_STATUS_KEY, JSON.stringify(newFeatureStatus));

      // Валидируем текущие настройки
      await validateAndDisableUnavailableFeatures(settings, newFeatureStatus);
    } catch (error) {
      console.error("Error checking feature availability:", error);
    }
  };

  /**
   * Запрос разрешения Health
   */
  const requestHealthPermission = async (): Promise<boolean> => {
    try {
      const granted = await healthService.requestPermissions();
      
      if (granted) {
        const status = healthService.getStatus();
        setHealthStatus(status);
        
        const newFeatureStatus = {
          ...featureStatus,
          healthAvailable: status.isAvailable,
          healthAuthorized: status.isAuthorized,
          lastChecked: new Date().toISOString(),
        };
        
        setFeatureStatus(newFeatureStatus);
        await AsyncStorage.setItem(FEATURE_STATUS_KEY, JSON.stringify(newFeatureStatus));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error requesting health permission:", error);
      return false;
    }
  };

  /**
   * Отключение Health интеграции
   */
  const disconnectHealth = async (): Promise<void> => {
    try {
      await healthService.disconnect();
      
      const newFeatureStatus = {
        ...featureStatus,
        healthAuthorized: false,
        lastChecked: new Date().toISOString(),
      };
      
      setFeatureStatus(newFeatureStatus);
      setHealthStatus(healthService.getStatus());
      await AsyncStorage.setItem(FEATURE_STATUS_KEY, JSON.stringify(newFeatureStatus));
      
      // Отключаем связанные настройки
      if (settings.burnedCalories) {
        await updateSetting("burnedCalories", false);
      }
    } catch (error) {
      console.error("Error disconnecting health:", error);
    }
  };

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> => {
    // Проверяем доступность функции перед включением
    if (value === true) {
      if (key === "burnedCalories" && !featureStatus.healthAuthorized) {
        // Запрашиваем разрешение
        const granted = await requestHealthPermission();
        if (!granted) {
          Alert.alert(
            "Разрешение не получено",
            "Для использования этой функции необходимо разрешить доступ к данным о здоровье.",
            [{ text: "OK" }]
          );
          return;
        }
      }
      
      if (key === "liveActivity" && !featureStatus.liveActivityAvailable) {
        Alert.alert(
          "Функция недоступна",
          Platform.OS === "ios" 
            ? "Live Activity требует iOS 16 или новее."
            : "Live Activity доступна только на iOS.",
          [{ text: "OK" }]
        );
        return;
      }
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Error saving app settings:", error);
    }
  };

  /**
   * Получение сожжённых калорий через HealthService
   * ОПТИМИЗАЦИЯ: Добавлен throttle для предотвращения частых вызовов
   */
  const lastRefreshTimeRef = React.useRef(0);
  const MIN_REFRESH_INTERVAL = 30000; // Минимум 30 секунд между обновлениями

  const refreshBurnedCalories = useCallback(async () => {
    if (!settings.burnedCalories || !featureStatus.healthAuthorized) return;

    // ОПТИМИЗАЦИЯ: Throttle - не чаще чем раз в 30 секунд
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < MIN_REFRESH_INTERVAL) {
      return;
    }
    lastRefreshTimeRef.current = now;

    try {
      const data = await healthService.getTodayData();
      
      if (data) {
        const burnedData: BurnedCaloriesData = {
          date: data.date,
          activeCalories: data.activeCalories,
          restingCalories: data.restingCalories,
          totalCalories: data.totalCalories,
          steps: data.steps,
          distance: data.distance,
          flightsClimbed: data.flightsClimbed,
          lastUpdated: data.lastUpdated,
        };
        
        setBurnedCalories(burnedData);
        
        // Кэшируем данные
        await AsyncStorage.setItem(
          `${BURNED_CALORIES_KEY}_${data.date}`,
          JSON.stringify(burnedData)
        );
      }
    } catch (error) {
      console.error("Error refreshing burned calories:", error);
      
      // Если произошла ошибка, возможно разрешения были отозваны
      await checkFeatureAvailability();
    }
  }, [settings.burnedCalories, featureStatus.healthAuthorized]);

  const getBurnedCaloriesForDate = async (dateStr: string): Promise<BurnedCaloriesData | null> => {
    if (!settings.burnedCalories) return null;

    try {
      const cached = await AsyncStorage.getItem(`${BURNED_CALORIES_KEY}_${dateStr}`);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch {
      return null;
    }
  };

  /**
   * Загрузка данных о переносе калорий
   */
  const loadRolloverData = async () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    
    try {
      const cached = await AsyncStorage.getItem(`${CALORIE_ROLLOVER_KEY}_${todayStr}`);
      if (cached) {
        setRolloverCalories(JSON.parse(cached));
      }
    } catch (error) {
      console.error("Error loading rollover data:", error);
    }
  };

  /**
   * Расчёт переноса калорий (максимум 200)
   */
  const calculateRollover = useCallback((
    yesterdayConsumed: number,
    yesterdayTarget: number
  ): number => {
    if (!settings.calorieRollover) return 0;
    
    const remaining = yesterdayTarget - yesterdayConsumed;
    
    // Только если остались неиспользованные калории
    if (remaining <= 0) return 0;
    
    // Максимум 200 калорий
    return Math.min(remaining, 200);
  }, [settings.calorieRollover]);

  const getRolloverForDate = async (dateStr: string): Promise<CalorieRolloverData | null> => {
    if (!settings.calorieRollover) return null;

    try {
      const cached = await AsyncStorage.getItem(`${CALORIE_ROLLOVER_KEY}_${dateStr}`);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch {
      return null;
    }
  };

  /**
   * Авто-корректировка макроэлементов при изменении целевых калорий
   */
  const calculateAdjustedMacros = useCallback((
    targetCalories: number,
    weight: number,
    goal: "lose" | "maintain" | "gain"
  ): { protein: number; carbs: number; fats: number } => {
    if (!settings.autoMacroAdjust) {
      // Возвращаем стандартное распределение 30/40/30
      return {
        protein: Math.round((targetCalories * 0.30) / 4),
        carbs: Math.round((targetCalories * 0.40) / 4),
        fats: Math.round((targetCalories * 0.30) / 9),
      };
    }

    // Расчёт белка на основе веса и цели
    let proteinGrams: number;
    if (goal === "lose") {
      proteinGrams = weight * 2.2; // Больше белка при похудении
    } else if (goal === "gain") {
      proteinGrams = weight * 2.0; // Для набора массы
    } else {
      proteinGrams = weight * 1.8; // Для поддержания
    }

    const proteinCalories = proteinGrams * 4;

    // Расчёт жиров (0.9-1.0 г на кг веса)
    const fatGramsPerKg = goal === "lose" ? 0.9 : 1.0;
    const fatGrams = weight * fatGramsPerKg;
    const fatCalories = fatGrams * 9;

    // Остаток на углеводы
    const carbsCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
    const carbsGrams = carbsCalories / 4;

    return {
      protein: Math.round(proteinGrams),
      carbs: Math.round(carbsGrams),
      fats: Math.round(fatGrams),
    };
  }, [settings.autoMacroAdjust]);

  /**
   * Проверка, нужно ли показывать анимацию значка
   */
  const shouldShowBadgeCelebration = useCallback((): boolean => {
    return settings.badgeCelebrations && pendingBadgeCelebration !== null && !badgeCelebrationShown;
  }, [settings.badgeCelebrations, pendingBadgeCelebration, badgeCelebrationShown]);

  const markBadgeCelebrationShown = () => {
    setBadgeCelebrationShown(true);
    setPendingBadgeCelebration(null);
    // Сбросим флаг через некоторое время
    setTimeout(() => setBadgeCelebrationShown(false), 1000);
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <AppSettingsContext.Provider
      value={{
        settings,
        featureStatus,
        updateSetting,
        healthStatus,
        requestHealthPermission,
        disconnectHealth,
        burnedCalories,
        refreshBurnedCalories,
        getBurnedCaloriesForDate,
        rolloverCalories,
        calculateRollover,
        getRolloverForDate,
        calculateAdjustedMacros,
        shouldShowBadgeCelebration,
        markBadgeCelebrationShown,
        pendingBadgeCelebration,
        setPendingBadgeCelebration,
        checkFeatureAvailability,
        isLoaded,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within an AppSettingsProvider");
  }
  return context;
}

export default AppSettingsContext;
