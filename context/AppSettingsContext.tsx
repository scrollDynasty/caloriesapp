import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { HealthPermissionStatus, healthService } from "../services/health";

const APP_SETTINGS_KEY = "@caloriesapp:app_settings";
const BURNED_CALORIES_KEY = "@caloriesapp:burned_calories";
const CALORIE_ROLLOVER_KEY = "@caloriesapp:calorie_rollover";
const FEATURE_STATUS_KEY = "@caloriesapp:feature_status";

export interface AppSettings {
  badgeCelebrations: boolean;     
  liveActivity: boolean;          
  burnedCalories: boolean;        
  calorieRollover: boolean;       
  autoMacroAdjust: boolean;       
}

export interface FeatureStatus {
  healthAvailable: boolean;
  healthAuthorized: boolean;
  liveActivityAvailable: boolean;
  lastChecked: string;
}

export interface BurnedCaloriesData {
  date: string;
  activeCalories: number;
  restingCalories: number;
  totalCalories: number;
  steps: number;
  distance?: number;
  flightsClimbed?: number;
  lastUpdated: string;
}

export interface CalorieRolloverData {
  fromDate: string;
  toDate: string;
  amount: number;
  used: boolean;
}

interface AppSettingsContextType {
  settings: AppSettings;
  featureStatus: FeatureStatus;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  
  healthStatus: HealthPermissionStatus | null;
  requestHealthPermission: () => Promise<boolean>;
  disconnectHealth: () => Promise<void>;
  
  burnedCalories: BurnedCaloriesData | null;
  refreshBurnedCalories: () => Promise<void>;
  getBurnedCaloriesForDate: (dateStr: string) => Promise<BurnedCaloriesData | null>;
  
  rolloverCalories: CalorieRolloverData | null;
  calculateRollover: (yesterdayConsumed: number, yesterdayTarget: number) => number;
  getRolloverForDate: (dateStr: string) => Promise<CalorieRolloverData | null>;
  
  calculateAdjustedMacros: (
    targetCalories: number,
    weight: number,
    goal: "lose" | "maintain" | "gain"
  ) => { protein: number; carbs: number; fats: number };
  
  shouldShowBadgeCelebration: () => boolean;
  markBadgeCelebrationShown: () => void;
  pendingBadgeCelebration: string | null;
  setPendingBadgeCelebration: (badge: string | null) => void;
  
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

  useEffect(() => {
    initializeSettings();
  }, []);

  const hasRefreshedBurnedCaloriesRef = React.useRef(false);
  useEffect(() => {
    if (settings.burnedCalories && isLoaded && featureStatus.healthAuthorized && !hasRefreshedBurnedCaloriesRef.current) {
      hasRefreshedBurnedCaloriesRef.current = true;
      refreshBurnedCalories();
    }
    if (!settings.burnedCalories) {
      hasRefreshedBurnedCaloriesRef.current = false;
    }
  }, [settings.burnedCalories, isLoaded, featureStatus.healthAuthorized]);

  useEffect(() => {
    if (settings.calorieRollover && isLoaded) {
      loadRolloverData();
    }
  }, [settings.calorieRollover, isLoaded]);

  const initializeSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(APP_SETTINGS_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }

      const storedStatus = await AsyncStorage.getItem(FEATURE_STATUS_KEY);
      if (storedStatus) {
        setFeatureStatus(JSON.parse(storedStatus));
      }

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

      await validateAndDisableUnavailableFeatures(storedSettings ? JSON.parse(storedSettings) : defaultSettings, newFeatureStatus);
    } catch (error) {
    } finally {
      setIsLoaded(true);
    }
  };

  const validateAndDisableUnavailableFeatures = async (
    currentSettings: AppSettings,
    status: FeatureStatus
  ) => {
    let needsUpdate = false;
    const updatedSettings = { ...currentSettings };

    if (currentSettings.burnedCalories && !status.healthAuthorized) {
      updatedSettings.burnedCalories = false;
      needsUpdate = true;
    }

    if (currentSettings.liveActivity && !status.liveActivityAvailable) {
      updatedSettings.liveActivity = false;
      needsUpdate = true;
    }

    if (needsUpdate) {
      setSettings(updatedSettings);
      await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(updatedSettings));
    }
  };

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

      await validateAndDisableUnavailableFeatures(settings, newFeatureStatus);
    } catch (error) {
    }
  };

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
      return false;
    }
  };

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
      
      if (settings.burnedCalories) {
        await updateSetting("burnedCalories", false);
      }
    } catch (error) {
    }
  };

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> => {
    if (value === true) {
      if (key === "burnedCalories" && !featureStatus.healthAuthorized) {
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
    }
  };

  const lastRefreshTimeRef = React.useRef(0);
  const MIN_REFRESH_INTERVAL = 30000;

  const refreshBurnedCalories = useCallback(async () => {
    if (!settings.burnedCalories || !featureStatus.healthAuthorized) return;

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
        
        await AsyncStorage.setItem(
          `${BURNED_CALORIES_KEY}_${data.date}`,
          JSON.stringify(burnedData)
        );
      }
    } catch (error) {
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

  const loadRolloverData = async () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    
    try {
      const cached = await AsyncStorage.getItem(`${CALORIE_ROLLOVER_KEY}_${todayStr}`);
      if (cached) {
        setRolloverCalories(JSON.parse(cached));
      }
    } catch (error) {
    }
  };

  const calculateRollover = useCallback((
    yesterdayConsumed: number,
    yesterdayTarget: number
  ): number => {
    if (!settings.calorieRollover) return 0;
    
    const remaining = yesterdayTarget - yesterdayConsumed;
    
    if (remaining <= 0) return 0;
    
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

  const calculateAdjustedMacros = useCallback((
    targetCalories: number,
    weight: number,
    goal: "lose" | "maintain" | "gain"
  ): { protein: number; carbs: number; fats: number } => {
    if (!settings.autoMacroAdjust) {
      return {
        protein: Math.round((targetCalories * 0.30) / 4),
        carbs: Math.round((targetCalories * 0.40) / 4),
        fats: Math.round((targetCalories * 0.30) / 9),
      };
    }

    let proteinGrams: number;
    if (goal === "lose") {
      proteinGrams = weight * 2.2;
    } else if (goal === "gain") {
      proteinGrams = weight * 2.0;
    } else {
      proteinGrams = weight * 1.8;
    }

    const proteinCalories = proteinGrams * 4;

    const fatGramsPerKg = goal === "lose" ? 0.9 : 1.0;
    const fatGrams = weight * fatGramsPerKg;
    const fatCalories = fatGrams * 9;

    const carbsCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
    const carbsGrams = carbsCalories / 4;

    return {
      protein: Math.round(proteinGrams),
      carbs: Math.round(carbsGrams),
      fats: Math.round(fatGrams),
    };
  }, [settings.autoMacroAdjust]);

  const shouldShowBadgeCelebration = useCallback((): boolean => {
    return settings.badgeCelebrations && pendingBadgeCelebration !== null && !badgeCelebrationShown;
  }, [settings.badgeCelebrations, pendingBadgeCelebration, badgeCelebrationShown]);

  const markBadgeCelebrationShown = () => {
    setPendingBadgeCelebration(null);
    setBadgeCelebrationShown(true);
    setTimeout(() => {
      setBadgeCelebrationShown(false);
    }, 500);
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
