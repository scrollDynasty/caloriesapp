
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AxiosResponse } from "axios";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { Platform } from "react-native";
import { API_BASE_URL, API_ENDPOINTS } from "../constants/api";
import { DailyMealsData, dataCache, OnboardingData, UserData } from "../stores/dataCache";
import { getLocalTimezoneOffset } from "../utils/timezone";

const TOKEN_KEY = "@caloriesapp:auth_token";

// Event listeners для глобального состояния авторизации
type AuthEventCallback = () => void;
const authEventListeners: Set<AuthEventCallback> = new Set();

export const onAuthExpired = (callback: AuthEventCallback): (() => void) => {
  authEventListeners.add(callback);
  return () => authEventListeners.delete(callback);
};

const notifyAuthExpired = () => {
  authEventListeners.forEach(callback => callback());
};

export interface MealPhoto {
  id: number;
  user_id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  barcode?: string | null;
  meal_name?: string | null;
  detected_meal_name?: string | null;
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
  created_at: string;
  updated_at?: string | null;
}

export interface MealPhotoUploadResponse {
  photo: MealPhoto;
  url: string;
}

export interface ManualMealPayload {
  meal_name: string;
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
  created_at?: string;
}

export interface WaterPayload {
  amount_ml: number;
  goal_ml?: number | null;
  created_at?: string;
}

export interface WaterEntry {
  id: number;
  amount_ml: number;
  goal_ml?: number | null;
  created_at: string;
}

export interface WaterDaily {
  date: string;
  total_ml: number;
  goal_ml?: number | null;
  entries: WaterEntry[];
}

class ApiService {
  private api: AxiosInstance;
  private cachedToken: string | null = null;
  private mealPhotosCache: { data: MealPhoto[]; timestamp: number | null } = {
    data: [],
    timestamp: null,
  };

  private upsertMealPhotoInCache(photo: MealPhoto) {
    const existing = this.mealPhotosCache.data;
    const next = [photo, ...existing.filter((p) => p.id !== photo.id)];
    this.mealPhotosCache = { data: next, timestamp: Date.now() };
  }

  private removeMealPhotoFromCache(photoId: number) {
    if (!this.mealPhotosCache.data.length) return;
    this.mealPhotosCache = {
      data: this.mealPhotosCache.data.filter((p) => p.id !== photoId),
      timestamp: this.mealPhotosCache.timestamp,
    };
  }

  invalidateMealPhotosCache() {
    this.mealPhotosCache = { data: [], timestamp: null };
  }

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, 
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Токен истёк или недействителен - очищаем и уведомляем
          await this.removeToken();
          // Очищаем кэш данных
          dataCache.invalidateAll();
          // Уведомляем слушателей (для редиректа на логин)
          notifyAuthExpired();
        }
        return Promise.reject(error);
      }
    );

    this.loadTokenFromStorage();
  }

  private async loadTokenFromStorage(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        this.cachedToken = token;
      }
    } catch (error) {
      console.error("Ошибка загрузки токена:", error);
    }
  }

  async saveToken(token: string): Promise<void> {
    try {
      
      this.cachedToken = token;
      
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error("Ошибка сохранения токена:", error);
    }
  }

  async getToken(): Promise<string | null> {
    
    if (this.cachedToken) {
      return this.cachedToken;
    }
    
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        this.cachedToken = token;
      }
      return token;
    } catch (error) {
      console.error("Ошибка получения токена:", error);
      return null;
    }
  }

  async removeToken(): Promise<void> {
    try {
      this.cachedToken = null;
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error("Ошибка удаления токена:", error);
    }
  }

  getCachedToken(): string | null {
    return this.cachedToken;
  }

  async authGoogle(idToken: string) {
    const response = await this.api.post(API_ENDPOINTS.AUTH_GOOGLE, {
      id_token: idToken,
    });
    const { access_token, user_id } = response.data;
    
    await this.saveToken(access_token);
    return { token: access_token, userId: user_id };
  }

  async authApple(idToken: string, authorizationCode?: string) {
    const response = await this.api.post(API_ENDPOINTS.AUTH_APPLE, {
      id_token: idToken,
      authorization_code: authorizationCode,
    });
    const { access_token, user_id } = response.data;
    
    await this.saveToken(access_token);
    return { token: access_token, userId: user_id };
  }

  async getCurrentUser() {
    const response = await this.api.get(API_ENDPOINTS.AUTH_ME);
    // Сохраняем в кэш
    dataCache.setUser(response.data);
    return response.data;
  }

  /**
   * Получить пользователя с кэшированием
   */
  async getCurrentUserCached(): Promise<{ data: UserData | null; isFromCache: boolean }> {
    const cached = dataCache.getUser();
    const isStale = dataCache.isUserStale();

    if (cached) {
      if (isStale && !dataCache.isPendingUpdate("user")) {
        dataCache.setPendingUpdate("user");
        this.getCurrentUser()
          .catch((e) => console.warn("Background user update failed:", e))
          .finally(() => dataCache.clearPendingUpdate("user"));
      }
      return { data: cached, isFromCache: true };
    }

    try {
      const data = await this.getCurrentUser();
      return { data, isFromCache: false };
    } catch (error) {
      return { data: null, isFromCache: false };
    }
  }

  async saveOnboardingData(data: any) {
    const response = await this.api.post(API_ENDPOINTS.ONBOARDING, data);
    // Инвалидируем кэш после сохранения
    dataCache.setOnboarding(response.data);
    return response.data;
  }

  async getOnboardingData() {
    const response = await this.api.get(API_ENDPOINTS.ONBOARDING);
    // Сохраняем в кэш
    dataCache.setOnboarding(response.data);
    return response.data;
  }

  /**
   * Получить onboarding данные с кэшированием
   */
  async getOnboardingDataCached(): Promise<{ data: OnboardingData | null; isFromCache: boolean }> {
    const cached = dataCache.getOnboarding();
    const isStale = dataCache.isOnboardingStale();

    if (cached) {
      if (isStale && !dataCache.isPendingUpdate("onboarding")) {
        dataCache.setPendingUpdate("onboarding");
        this.getOnboardingData()
          .catch((e) => console.warn("Background onboarding update failed:", e))
          .finally(() => dataCache.clearPendingUpdate("onboarding"));
      }
      return { data: cached, isFromCache: true };
    }

    try {
      const data = await this.getOnboardingData();
      return { data, isFromCache: false };
    } catch (error) {
      return { data: null, isFromCache: false };
    }
  }

  async uploadMealPhoto(
    uri: string,
    fileName: string,
    mimeType: string,
    barcode?: string,
    mealName?: string
  ): Promise<MealPhotoUploadResponse> {
    const formData = new FormData();
    const normalizedUri =
      Platform.OS === "ios" ? uri.replace("file://", "") : uri;
    const ensuredFileName = fileName && fileName.includes(".")
      ? fileName
      : `${fileName || `photo_${Date.now()}`}.jpg`;
    const ensuredMime = mimeType || "image/jpeg";
    
    formData.append("file", {
      uri: normalizedUri,
      name: ensuredFileName,
      type: ensuredMime,
    } as any);
    
    formData.append("barcode", barcode || "");
    formData.append("meal_name", mealName || "");
    formData.append("client_timestamp", new Date().toISOString());
    formData.append("client_tz_offset_minutes", String(getLocalTimezoneOffset()));

    const response = await this.api.post<MealPhotoUploadResponse>(API_ENDPOINTS.MEALS_UPLOAD, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // Увеличен таймаут для OpenAI обработки
    });
    
    
    if (response.data?.photo) {
      this.upsertMealPhotoInCache(response.data.photo);
      // Инвалидируем кэш дневных данных
      const dateStr = new Date().toISOString().split("T")[0];
      dataCache.invalidateDailyMeals(dateStr);
    }
    
    return response.data;
  }

  async createManualMeal(payload: ManualMealPayload) {
    const data = {
      ...payload,
      created_at: payload.created_at || new Date().toISOString(),
    };
    const response = await this.api.post(API_ENDPOINTS.MEALS_MANUAL, data, {
      params: {
        client_timestamp: data.created_at,
        client_tz_offset_minutes: getLocalTimezoneOffset(),
      },
    });
    const created = response.data as MealPhoto;
    this.upsertMealPhotoInCache(created);
    // Инвалидируем кэш дневных данных
    const dateStr = new Date().toISOString().split("T")[0];
    dataCache.invalidateDailyMeals(dateStr);
    return created;
  }

  async addWater(payload: WaterPayload) {
    const data = {
      ...payload,
      created_at: payload.created_at || new Date().toISOString(),
    };
    const response = await this.api.post(API_ENDPOINTS.WATER, data, {
      params: { tz_offset_minutes: getLocalTimezoneOffset() },
    });
    // Инвалидируем кэш воды
    const dateStr = new Date().toISOString().split("T")[0];
    dataCache.invalidateWater(dateStr);
    return response.data as WaterEntry;
  }

  async getDailyWater(
    date: string,
    tzOffsetMinutes: number = getLocalTimezoneOffset()
  ): Promise<WaterDaily> {
    const response = await this.api.get(API_ENDPOINTS.WATER_DAILY, {
      params: { date, tz_offset_minutes: tzOffsetMinutes },
    });
    // Сохраняем в кэш
    dataCache.setWater(date, response.data);
    return response.data as WaterDaily;
  }

  /**
   * Получить воду с кэшированием (stale-while-revalidate)
   */
  async getDailyWaterCached(
    date: string,
    tzOffsetMinutes: number = getLocalTimezoneOffset()
  ): Promise<{ data: WaterDaily | null; isFromCache: boolean; isStale: boolean }> {
    const cached = dataCache.getWater(date);
    const isStale = dataCache.isWaterStale(date);

    if (cached) {
      if (isStale && !dataCache.isPendingUpdate(`water-${date}`)) {
        dataCache.setPendingUpdate(`water-${date}`);
        this.getDailyWater(date, tzOffsetMinutes)
          .catch((e) => console.warn("Background water update failed:", e))
          .finally(() => dataCache.clearPendingUpdate(`water-${date}`));
      }
      return { data: cached as WaterDaily, isFromCache: true, isStale };
    }

    try {
      const data = await this.getDailyWater(date, tzOffsetMinutes);
      return { data, isFromCache: false, isStale: false };
    } catch (error) {
      return { data: null, isFromCache: false, isStale: true };
    }
  }

  async getMealPhotos(skip: number = 0, limit: number = 100): Promise<MealPhoto[]> {
    const response = await this.api.get<MealPhoto[]>(API_ENDPOINTS.MEALS_PHOTOS, {
      params: { skip, limit },
    });
    return response.data;
  }

  async getMealPhotosCached(
    skip: number = 0,
    limit: number = 100,
    ttlMs: number = 30000
  ): Promise<MealPhoto[]> {
    const now = Date.now();
    const isCacheValid =
      this.mealPhotosCache.timestamp &&
      now - (this.mealPhotosCache.timestamp || 0) < ttlMs &&
      skip === 0;

    if (isCacheValid) {
      return this.mealPhotosCache.data.slice(0, limit);
    }

    const data = await this.getMealPhotos(skip, limit);
    if (skip === 0) {
      this.mealPhotosCache = { data, timestamp: now };
    }
    return data;
  }

  async getDailyMeals(
    date: string,
    tzOffsetMinutes: number = getLocalTimezoneOffset()
  ): Promise<DailyMealsData> {
    const response = await this.api.get(API_ENDPOINTS.MEALS_DAILY, {
      params: { date, tz_offset_minutes: tzOffsetMinutes },
    });
    // Сохраняем в кэш
    dataCache.setDailyMeals(date, response.data);
    return response.data;
  }

  /**
   * Получить дневные данные с кэшированием (stale-while-revalidate)
   * Возвращает кэшированные данные немедленно, обновляет в фоне если устарели
   */
  async getDailyMealsCached(
    date: string,
    tzOffsetMinutes: number = getLocalTimezoneOffset()
  ): Promise<{ data: DailyMealsData | null; isFromCache: boolean; isStale: boolean }> {
    const cached = dataCache.getDailyMeals(date);
    const isStale = dataCache.isDailyMealsStale(date);

    // Если есть кэш - возвращаем его
    if (cached) {
      // Если устарел и нет активного обновления - запускаем фоновое обновление
      if (isStale && !dataCache.isPendingUpdate(`daily-${date}`)) {
        dataCache.setPendingUpdate(`daily-${date}`);
        this.getDailyMeals(date, tzOffsetMinutes)
          .catch((e) => console.warn("Background daily update failed:", e))
          .finally(() => dataCache.clearPendingUpdate(`daily-${date}`));
      }
      return { data: cached, isFromCache: true, isStale };
    }

    // Нет кэша - загружаем синхронно
    try {
      const data = await this.getDailyMeals(date, tzOffsetMinutes);
      return { data, isFromCache: false, isStale: false };
    } catch (error) {
      return { data: null, isFromCache: false, isStale: true };
    }
  }

  async getDailyMealsBatch(
    dates: string[],
    tzOffsetMinutes: number = getLocalTimezoneOffset()
  ): Promise<Array<{
    date: string;
    total_calories: number;
    total_protein: number;
    total_fat: number;
    total_carbs: number;
  }>> {
    const response = await this.api.post(API_ENDPOINTS.MEALS_DAILY_BATCH, { dates }, {
      params: { tz_offset_minutes: tzOffsetMinutes },
    });
    // Сохраняем каждый день в кэш
    for (const item of response.data) {
      const cached = dataCache.getDailyMeals(item.date);
      if (cached) {
        // Обновляем только totals если уже есть данные
        cached.total_calories = item.total_calories;
        cached.total_protein = item.total_protein;
        cached.total_fat = item.total_fat;
        cached.total_carbs = item.total_carbs;
      }
    }
    return response.data;
  }

  /**
   * Получить batch данные с кэшированием
   */
  async getDailyMealsBatchCached(
    dates: string[],
    weekKey: string,
    tzOffsetMinutes: number = getLocalTimezoneOffset()
  ): Promise<{ data: Array<{ date: string; total_calories: number; total_protein: number; total_fat: number; total_carbs: number }> | null; isFromCache: boolean }> {
    const weekData = dataCache.getWeekData(weekKey);
    const isStale = dataCache.isWeekStale(weekKey);

    // Если есть кэш недели - собираем данные из него
    if (weekData && !isStale) {
      // Возвращаем из кэша прогресс
      const cachedResults = dates.map(date => {
        const daily = dataCache.getDailyMeals(date);
        return {
          date,
          total_calories: daily?.total_calories || 0,
          total_protein: daily?.total_protein || 0,
          total_fat: daily?.total_fat || 0,
          total_carbs: daily?.total_carbs || 0,
        };
      });
      
      // Фоновое обновление если устарело
      if (isStale && !dataCache.isPendingUpdate(`week-${weekKey}`)) {
        dataCache.setPendingUpdate(`week-${weekKey}`);
        this.getDailyMealsBatch(dates, tzOffsetMinutes)
          .catch((e) => console.warn("Background week update failed:", e))
          .finally(() => dataCache.clearPendingUpdate(`week-${weekKey}`));
      }
      
      return { data: cachedResults, isFromCache: true };
    }

    try {
      const data = await this.getDailyMealsBatch(dates, tzOffsetMinutes);
      return { data, isFromCache: false };
    } catch (error) {
      return { data: null, isFromCache: false };
    }
  }

  async deleteMealPhoto(photoId: number) {
    await this.api.delete(`${API_ENDPOINTS.MEALS_PHOTO}/${photoId}`);
    this.removeMealPhotoFromCache(photoId);
  }

  getMealPhotoUrl(photoId: number, token?: string): string {
    const qs = token ? `?token=${token}` : "";
    return `${API_BASE_URL}${API_ENDPOINTS.MEALS_PHOTO}/${photoId}${qs}`;
  }

  async updateMealPhoto(photoId: number, data: {
    meal_name?: string;
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
  }): Promise<MealPhoto> {
    const response = await this.api.put<MealPhoto>(
      `${API_ENDPOINTS.MEALS_PHOTO}/${photoId}`,
      data,
    );
    this.upsertMealPhotoInCache(response.data);
    return response.data;
  }

  async getMealPhotoDetail(photoId: number): Promise<{
    photo: MealPhoto;
    ingredients?: Array<{
      name: string;
      calories: number;
    }>;
    extra_macros?: {
      fiber?: number;
      sugar?: number;
      sodium?: number;
    };
    health_score?: number;
  }> {
    try {
      const response = await this.api.get(`${API_ENDPOINTS.MEALS_PHOTO}/${photoId}/detail`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 405) {
        return { photo: null as any };
      }
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.HEALTH}`, {
        timeout: 5000, 
      });
      return response.data;
    } catch (error: any) {
      console.error("Health check failed:", error);
      throw new Error(
        error.code === "ECONNABORTED" || error.message?.includes("timeout")
          ? "Сервер не отвечает. Проверьте, что бэкенд запущен."
          : error.code === "ECONNREFUSED"
          ? "Не удалось подключиться к серверу. Проверьте URL и что сервер запущен."
          : "Ошибка подключения к серверу"
      );
    }
  }
}

export const apiService = new ApiService();
