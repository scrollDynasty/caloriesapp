
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
import { getLocalDateStr, getLocalISOString, getLocalTimezoneOffset } from "../utils/timezone";

const TOKEN_KEY = "@caloriesapp:auth_token";

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
  fiber?: number | null;
  sugar?: number | null;
  sodium?: number | null;
  health_score?: number | null;
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
  fiber?: number | null;
  sugar?: number | null;
  sodium?: number | null;
  health_score?: number | null;
  created_at?: string;
}

export interface BarcodeLookup {
  barcode: string;
  name: string;
  brand?: string | null;
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
  fiber?: number | null;
  sugar?: number | null;
  sodium?: number | null;
  health_score?: number | null;
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
  // Prevent duplicate in-flight network calls for the same resource
  private inflightRequests: Map<string, Promise<any>> = new Map();

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

  private dedupRequest<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.inflightRequests.get(key);
    if (existing) return existing as Promise<T>;

    const promise = factory()
      .catch((error) => {
        // Ensure failed requests don't poison the map
        throw error;
      })
      .finally(() => {
        this.inflightRequests.delete(key);
      });

    this.inflightRequests.set(key, promise as Promise<any>);
    return promise as Promise<T>;
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
      if (__DEV__) console.error("Ошибка загрузки токена:", error);
    }
  }

  async saveToken(token: string): Promise<void> {
    try {
      
      this.cachedToken = token;
      
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      if (__DEV__) console.error("Ошибка сохранения токена:", error);
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
      if (__DEV__) console.error("Ошибка получения токена:", error);
      return null;
    }
  }

  async removeToken(): Promise<void> {
    try {
      this.cachedToken = null;
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      if (__DEV__) console.error("Ошибка удаления токена:", error);
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
    return this.dedupRequest("auth_me", async () => {
      const response = await this.api.get(API_ENDPOINTS.AUTH_ME);
      // Сохраняем в кэш
      dataCache.setUser(response.data);
      return response.data;
    });
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
          .catch((e) => { if (__DEV__) console.warn("Background user update failed:", e); })
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
    return this.dedupRequest("onboarding", async () => {
      const response = await this.api.get(API_ENDPOINTS.ONBOARDING);
      // Сохраняем в кэш
      dataCache.setOnboarding(response.data);
      return response.data;
    });
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
          .catch((e) => { if (__DEV__) console.warn("Background onboarding update failed:", e); })
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
    // Отправляем локальное время устройства (не UTC)
    formData.append("client_timestamp", getLocalISOString());
    formData.append("client_tz_offset_minutes", String(getLocalTimezoneOffset()));

    const response = await this.api.post<MealPhotoUploadResponse>(API_ENDPOINTS.MEALS_UPLOAD, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000,
    });
    
    if (response.data?.photo) {
      this.upsertMealPhotoInCache(response.data.photo);
      dataCache.invalidateDailyMeals(getLocalDateStr());
    }
    
    return response.data;
  }

  async createManualMeal(payload: ManualMealPayload) {
    const localTimestamp = payload.created_at || getLocalISOString();
    const data = {
      ...payload,
      created_at: localTimestamp,
    };
    const response = await this.api.post(API_ENDPOINTS.MEALS_MANUAL, data, {
      params: {
        client_timestamp: localTimestamp,
        client_tz_offset_minutes: getLocalTimezoneOffset(),
      },
    });
    const created = response.data as MealPhoto;
    this.upsertMealPhotoInCache(created);
    dataCache.invalidateDailyMeals(getLocalDateStr());
    return created;
  }

  async lookupBarcode(barcode: string): Promise<BarcodeLookup> {
    const code = (barcode || "").trim();
    if (!code) {
      throw new Error("Пустой штрихкод");
    }

    const toNum = (value: any) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    };

    try {
      const resp = await this.api.get(`${API_ENDPOINTS.MEALS_BARCODE}/${encodeURIComponent(code)}`);
      return resp.data;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        throw new Error("Продукт не найден");
      }

      // Fallback to public OpenFoodFacts if backend unavailable
      try {
        const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`;
        const response = await axios.get(url, { timeout: 12000 });

        if (response.data?.status !== 1 || !response.data?.product) {
          throw new Error("Продукт не найден");
        }

        const product = response.data.product;
        const nutriments = product?.nutriments || {};

        return {
          barcode: code,
          name: product.product_name || product.generic_name || "Продукт",
          brand: product.brands || null,
          calories: toNum(
            nutriments["energy-kcal_100g"] ??
            nutriments.energy_kcal_value ??
            nutriments.energy_kcal
          ),
          protein: toNum(nutriments.proteins_100g ?? nutriments.proteins_serving),
          fat: toNum(nutriments.fat_100g ?? nutriments.fat_serving),
          carbs: toNum(
            nutriments.carbohydrates_100g ??
            nutriments.carbohydrates_serving
          ),
          fiber: null,
          sugar: null,
          sodium: null,
          health_score: null,
        };
      } catch (fallbackError: any) {
        if (__DEV__ && fallbackError?.response?.status !== 404) {
          console.warn("Barcode lookup failed", fallbackError?.message || fallbackError);
        }
        throw new Error(fallbackError?.message || "Не удалось найти продукт");
      }
    }
  }

  async addWater(payload: WaterPayload) {
    const localTimestamp = payload.created_at || getLocalISOString();
    const data = {
      ...payload,
      created_at: localTimestamp,
    };
    const response = await this.api.post(API_ENDPOINTS.WATER, data, {
      params: { tz_offset_minutes: getLocalTimezoneOffset() },
    });
    dataCache.invalidateWater(getLocalDateStr());
    return response.data as WaterEntry;
  }

  async getDailyWater(
    date: string,
    tzOffsetMinutes: number = getLocalTimezoneOffset()
  ): Promise<WaterDaily> {
    const key = `water-${date}-${tzOffsetMinutes}`;
    return this.dedupRequest(key, async () => {
      const response = await this.api.get(API_ENDPOINTS.WATER_DAILY, {
        params: { date, tz_offset_minutes: tzOffsetMinutes },
      });
      dataCache.setWater(date, response.data);
      return response.data as WaterDaily;
    });
  }


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
          .catch((e) => { if (__DEV__) console.warn("Background water update failed:", e); })
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
    const key = `meal-photos-${skip}-${limit}`;
    return this.dedupRequest(key, async () => {
      const response = await this.api.get<MealPhoto[]>(API_ENDPOINTS.MEALS_PHOTOS, {
        params: { skip, limit },
      });
      return response.data;
    });
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
    const key = `daily-${date}-${tzOffsetMinutes}`;
    return this.dedupRequest(key, async () => {
      const response = await this.api.get(API_ENDPOINTS.MEALS_DAILY, {
        params: { date, tz_offset_minutes: tzOffsetMinutes },
      });
      // Сохраняем в кэш
      dataCache.setDailyMeals(date, response.data);
      return response.data;
    });
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
          .catch((e) => { if (__DEV__) console.warn("Background daily update failed:", e); })
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
    const key = `daily-batch-${dates.sort().join("|")}-${tzOffsetMinutes}`;
    return this.dedupRequest(key, async () => {
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
    });
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
          .catch((e) => { if (__DEV__) console.warn("Background week update failed:", e); })
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
    dataCache.invalidateDailyMeals(getLocalDateStr());
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
    dataCache.invalidateDailyMeals(getLocalDateStr());
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
    const key = `meal-detail-${photoId}`;
    return this.dedupRequest(key, async () => {
      try {
        const response = await this.api.get(`${API_ENDPOINTS.MEALS_PHOTO}/${photoId}/detail`);
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 405) {
          return { photo: null as any };
        }
        throw error;
      }
    });
  }

  async healthCheck() {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.HEALTH}`, {
        timeout: 5000, 
      });
      return response.data;
    } catch (error: any) {
      if (__DEV__) console.error("Health check failed:", error);
      throw new Error(
        error.code === "ECONNABORTED" || error.message?.includes("timeout")
          ? "Сервер не отвечает. Проверьте, что бэкенд запущен."
          : error.code === "ECONNREFUSED"
          ? "Не удалось подключиться к серверу. Проверьте URL и что сервер запущен."
          : "Ошибка подключения к серверу"
      );
    }
  }

  // Profile methods
  async getProfile(): Promise<{
    id: number;
    email?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    avatar_url?: string;
    streak_count?: number;
    created_at?: string;
  }> {
    return this.dedupRequest("profile", async () => {
      const response = await this.api.get(`${API_ENDPOINTS.AUTH}/profile`);
      return response.data;
    });
  }

  async updateProfile(data: {
    first_name?: string;
    last_name?: string;
    username?: string;
    avatar_url?: string | null;
  }): Promise<{
    id: number;
    email?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    avatar_url?: string;
  }> {
    const response = await this.api.put(`${API_ENDPOINTS.AUTH}/profile`, data);
    return response.data;
  }

  async checkUsername(username: string): Promise<{
    username: string;
    available: boolean;
    message: string;
  }> {
    const response = await this.api.post(`${API_ENDPOINTS.AUTH}/check-username`, { username });
    return response.data;
  }

  async addWeightLog(weight: number, created_at?: string): Promise<{
    id: number;
    user_id: number;
    weight: number;
    created_at: string;
  }> {
    const response = await this.api.post('/api/v1/progress/weight', {
      weight,
      created_at: created_at || new Date().toISOString(),
    });
    dataCache.invalidateOnboarding();
    return response.data;
  }

  async getWeightHistory(limit: number = 100): Promise<Array<{
    id: number;
    user_id: number;
    weight: number;
    created_at: string;
  }>> {
    const response = await this.api.get('/api/v1/progress/weight/history', {
      params: { limit },
    });
    return response.data;
  }

  async getWeightStats(): Promise<{
    current_weight: number | null;
    target_weight: number | null;
    start_weight: number | null;
    total_change: number | null;
    changes: Array<{
      period: string;
      change_kg: number | null;
      status: string;
    }>;
    history: Array<{
      id: number;
      weight: number;
      created_at: string;
    }>;
  }> {
    const response = await this.api.get('/api/v1/progress/weight/stats');
    return response.data;
  }

  async uploadProgressPhoto(uri: string, fileName: string, mimeType: string): Promise<{
    id: number;
    file_name: string;
    url: string;
    created_at: string;
  }> {
    const formData = new FormData();
    const normalizedUri = Platform.OS === "ios" ? uri.replace("file://", "") : uri;
    const ensuredFileName = fileName && fileName.includes(".")
      ? fileName
      : `${fileName || `photo_${Date.now()}`}.jpg`;
    const ensuredMime = mimeType || "image/jpeg";
    
    formData.append("file", {
      uri: normalizedUri,
      name: ensuredFileName,
      type: ensuredMime,
    } as any);

    const response = await this.api.post('/api/v1/progress/photos', formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000,
    });
    
    return response.data;
  }

  async getProgressPhotos(): Promise<Array<{
    id: number;
    user_id: number;
    file_path: string;
    file_name: string;
    created_at: string;
  }>> {
    return this.dedupRequest("progress-photos", async () => {
      const response = await this.api.get('/api/v1/progress/photos');
      return response.data;
    });
  }

  getProgressPhotoUrl(photoId: number): string {
    return `${API_BASE_URL}/api/v1/progress/photos/${photoId}`;
  }

  async deleteProgressPhoto(photoId: number): Promise<void> {
    await this.api.delete(`/api/v1/progress/photos/${photoId}`);
  }

  async getProgressData(): Promise<{
    streak_count: number;
    badges_count: number;
    weight_stats: {
      current_weight: number | null;
      target_weight: number | null;
      start_weight: number | null;
      total_change: number | null;
      changes: Array<{
        period: string;
        change_kg: number | null;
        status: string;
      }>;
      history: Array<{
        id: number;
        weight: number;
        created_at: string;
      }>;
    };
    calorie_stats: Array<{
      period: string;
      average_calories: number | null;
      average_consumed: number | null;
      status: string;
    }>;
    energy_changes: Array<{
      period: string;
      change_calories: number | null;
      status: string;
    }>;
    bmi: number | null;
    bmi_category: string | null;
  }> {
    return this.dedupRequest("progress-data", async () => {
      const response = await this.api.get('/api/v1/progress/data');
      return response.data;
    });
  }

  async addMealIngredient(
    photoId: number,
    ingredient: { name: string; calories: number }
  ): Promise<{ success: boolean; ingredients: Array<{ name: string; calories: number }> }> {
    const response = await this.api.post(
      `${API_ENDPOINTS.MEALS_PHOTO}/${photoId}/ingredients`,
      ingredient
    );
    dataCache.invalidateDailyMeals(getLocalDateStr());
    return response.data;
  }

  async correctMealWithAI(
    photoId: number,
    correction: string
  ): Promise<{
    meal_name: string;
    calories: number;
    protein: number;
    fats: number;
    carbs: number;
    ingredients?: Array<{ name: string; calories: number }>;
    extra_macros?: { fiber: number; sugar: number; sodium: number };
    health_score?: number;
  }> {
    const response = await this.api.post(
      `${API_ENDPOINTS.MEALS_PHOTO}/${photoId}/correct`,
      { correction }
    );
    dataCache.invalidateDailyMeals(getLocalDateStr());
    return response.data;
  }
}

export const apiService = new ApiService();
