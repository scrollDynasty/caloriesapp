import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Linking, Platform } from "react-native";
import * as HealthIntegration from "../modules/health-integration";

const HEALTH_PERMISSIONS_KEY = "@caloriesapp:health_permissions";
const HEALTH_DATA_CACHE_KEY = "@caloriesapp:health_data_cache";
const HEALTH_AVAILABLE_KEY = "@caloriesapp:health_available";

export interface HealthData {
  steps: number;
  activeCalories: number;
  restingCalories: number;
  totalCalories: number;
  distance: number;
  flightsClimbed: number;
  date: string;
  lastUpdated: string;
}

export interface HealthPermissionStatus {
  isAvailable: boolean;
  isAuthorized: boolean;
  canRequestPermission: boolean;
  lastChecked: string;
}

export interface WeeklyHealthData {
  days: HealthData[];
  totalSteps: number;
  avgSteps: number;
  totalCalories: number;
  avgCalories: number;
}

class HealthService {
  private isInitialized = false;
  private permissionStatus: HealthPermissionStatus = {
    isAvailable: false,
    isAuthorized: false,
    canRequestPermission: true,
    lastChecked: "",
  };

  async initialize(): Promise<HealthPermissionStatus> {
    if (this.isInitialized) return this.permissionStatus;

    try {
      const savedStatus = await AsyncStorage.getItem(HEALTH_PERMISSIONS_KEY);
      if (savedStatus) this.permissionStatus = JSON.parse(savedStatus);

      const isAvailable = await this.checkAvailability();
      this.permissionStatus.isAvailable = isAvailable;
      this.permissionStatus.lastChecked = new Date().toISOString();

      if (isAvailable) {
        this.permissionStatus.isAuthorized = await this.checkAuthorization();
      }

      await this.savePermissionStatus();
      this.isInitialized = true;
    } catch {
      this.permissionStatus.isAvailable = false;
    }

    return this.permissionStatus;
  }

  async checkAvailability(): Promise<boolean> {
    try {
      return await HealthIntegration.isHealthAvailable();
    } catch {
      return false;
    }
  }

  async checkAuthorization(): Promise<boolean> {
    try {
      const status = await HealthIntegration.getAuthorizationStatus();
      const isAuthorized = status === "authorized";
      await AsyncStorage.setItem(HEALTH_AVAILABLE_KEY, isAuthorized ? "true" : "false");
      return isAuthorized;
    } catch {
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (!this.permissionStatus.isAvailable) {
        this.showHealthNotAvailableAlert();
        return false;
      }

      const shouldProceed = await this.showPermissionInstructions();
      if (!shouldProceed) return false;

      const granted = await HealthIntegration.requestHealthPermissions();
      
      if (granted) {
        this.permissionStatus.isAuthorized = true;
        await AsyncStorage.setItem(HEALTH_AVAILABLE_KEY, "true");
        await this.savePermissionStatus();
        return true;
      }
      
      this.showManualSetupInstructions();
      return false;
    } catch {
      this.showManualSetupInstructions();
      return false;
    }
  }

  private async showPermissionInstructions(): Promise<boolean> {
    return new Promise((resolve) => {
      if (Platform.OS === "ios") {
        Alert.alert(
          "Подключение Apple Health",
          "Разрешите доступ к:\n• Шаги\n• Активные калории\n• Базовые калории\n• Дистанция\n• Этажи",
          [
            { text: "Отмена", style: "cancel", onPress: () => resolve(false) },
            { text: "Продолжить", onPress: () => resolve(true) },
          ]
        );
      } else {
        Alert.alert(
          "Подключение Health Connect",
          "Необходимо установить Health Connect и разрешить доступ к данным.",
          [
            { text: "Отмена", style: "cancel", onPress: () => resolve(false) },
            {
              text: "Play Store",
              onPress: async () => {
                await Linking.openURL("https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata");
                resolve(false);
              },
            },
          ]
        );
      }
    });
  }

  private showManualSetupInstructions(): void {
    if (Platform.OS === "ios") {
      Alert.alert(
        "Настройка Apple Health",
        "Откройте «Здоровье» → Обзор → Доступ к данным → Yeb Ich",
        [
          { text: "Позже", style: "cancel" },
          { text: "Открыть", onPress: () => Linking.openURL("x-apple-health://") },
        ]
      );
    } else {
      Alert.alert("Настройка Health Connect", "Откройте Health Connect и разрешите доступ.", [{ text: "Понятно" }]);
    }
  }

  async getTodayData(): Promise<HealthData | null> {
    if (!this.permissionStatus.isAuthorized) return null;

    const dateStr = this.formatDate(new Date());

    try {
      const cached = await this.getCachedData(dateStr);
      if (cached && this.isCacheFresh(cached.lastUpdated, 5)) return cached;

      const nativeData = await HealthIntegration.getHealthDataForDate(dateStr);
      
      const data: HealthData = {
        steps: nativeData.steps,
        activeCalories: nativeData.activeCalories,
        restingCalories: nativeData.basalCalories,
        totalCalories: nativeData.totalCalories,
        distance: nativeData.distance,
        flightsClimbed: nativeData.flightsClimbed,
        date: dateStr,
        lastUpdated: new Date().toISOString(),
      };

      await this.cacheData(dateStr, data);
      return data;
    } catch {
      return await this.getCachedData(dateStr);
    }
  }

  async getWeeklyData(): Promise<WeeklyHealthData | null> {
    if (!this.permissionStatus.isAuthorized) return null;

    try {
      const days: HealthData[] = [];
      const endDate = new Date();

      for (let i = 0; i < 7; i++) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        const dateStr = this.formatDate(date);

        try {
          const nativeData = await HealthIntegration.getHealthDataForDate(dateStr);
          days.push({
            steps: nativeData.steps,
            activeCalories: nativeData.activeCalories,
            restingCalories: nativeData.basalCalories,
            totalCalories: nativeData.totalCalories,
            distance: nativeData.distance,
            flightsClimbed: nativeData.flightsClimbed,
            date: dateStr,
            lastUpdated: new Date().toISOString(),
          });
        } catch {}
      }

      if (days.length === 0) return null;

      const totalSteps = days.reduce((sum, day) => sum + day.steps, 0);
      const totalCalories = days.reduce((sum, day) => sum + day.activeCalories, 0);

      return {
        days,
        totalSteps,
        avgSteps: Math.round(totalSteps / days.length),
        totalCalories,
        avgCalories: Math.round(totalCalories / days.length),
      };
    } catch {
      return null;
    }
  }

  private async cacheData(dateStr: string, data: HealthData): Promise<void> {
    try {
      await AsyncStorage.setItem(`${HEALTH_DATA_CACHE_KEY}_${dateStr}`, JSON.stringify(data));
    } catch {}
  }

  private async getCachedData(dateStr: string): Promise<HealthData | null> {
    try {
      const cached = await AsyncStorage.getItem(`${HEALTH_DATA_CACHE_KEY}_${dateStr}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private isCacheFresh(lastUpdated: string, maxAgeMinutes: number): boolean {
    const diffMs = Date.now() - new Date(lastUpdated).getTime();
    return diffMs / (1000 * 60) < maxAgeMinutes;
  }

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  private async savePermissionStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem(HEALTH_PERMISSIONS_KEY, JSON.stringify(this.permissionStatus));
    } catch {}
  }

  private showHealthNotAvailableAlert(): void {
    const isExpoGo = !!(global as any).__DEV__;
    
    if (Platform.OS === "ios") {
      Alert.alert(
        isExpoGo ? "Apple Health недоступен в Expo Go" : "Apple Health недоступен",
        isExpoGo 
          ? "Нужен development build:\neas build --profile development --platform ios" 
          : "Apple Health недоступен на этом устройстве.",
        [
          { text: "Понятно", style: "cancel" },
          ...(isExpoGo ? [{ text: "Документация", onPress: () => Linking.openURL("https://docs.expo.dev/development/introduction/") }] : []),
        ]
      );
    } else {
      Alert.alert(
        isExpoGo ? "Health Connect недоступен в Expo Go" : "Health Connect недоступен",
        isExpoGo 
          ? "Нужен development build:\neas build --profile development --platform android" 
          : "Установите Health Connect из Google Play.",
        [
          { text: "Понятно", style: "cancel" },
          ...(!isExpoGo ? [{ text: "Установить", onPress: () => Linking.openURL("https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata") }] : []),
        ]
      );
    }
  }

  async disconnect(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HEALTH_AVAILABLE_KEY);
      this.permissionStatus.isAuthorized = false;
      await this.savePermissionStatus();
    } catch {}
  }

  getStatus(): HealthPermissionStatus {
    return { ...this.permissionStatus };
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(HEALTH_DATA_CACHE_KEY));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch {}
  }
}

export const healthService = new HealthService();
export default healthService;
