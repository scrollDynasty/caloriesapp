
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
import { sanitizeBarcode, sanitizeFileName, sanitizeNumber, sanitizeString, sanitizeUrl } from "../utils/validation";

const TOKEN_KEY = "@yebich:auth_token";

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
          await this.removeToken();
          dataCache.invalidateAll();
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
    } catch {
    }
  }

  async saveToken(token: string): Promise<void> {
    if (typeof token !== 'string' || !token.trim()) {
      throw new Error("Invalid token");
    }
    
    try {
      this.cachedToken = token.trim();
      await AsyncStorage.setItem(TOKEN_KEY, this.cachedToken);
    } catch {
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
    } catch {
      return null;
    }
  }

  async removeToken(): Promise<void> {
    try {
      this.cachedToken = null;
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch {
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
      dataCache.setUser(response.data);
      return response.data;
    });
  }

  async getCurrentUserCached(): Promise<{ data: UserData | null; isFromCache: boolean }> {
    const cached = dataCache.getUser();
    const isStale = dataCache.isUserStale();

    if (cached) {
      if (isStale && !dataCache.isPendingUpdate("user")) {
        dataCache.setPendingUpdate("user");
        this.getCurrentUser()
          .catch(() => {})
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
    dataCache.setOnboarding(response.data);
    return response.data;
  }

  async getOnboardingData() {
    return this.dedupRequest("onboarding", async () => {
      const response = await this.api.get(API_ENDPOINTS.ONBOARDING);
      dataCache.setOnboarding(response.data);
      return response.data;
    });
  }

  async getOnboardingDataCached(): Promise<{ data: OnboardingData | null; isFromCache: boolean }> {
    const cached = dataCache.getOnboarding();
    const isStale = dataCache.isOnboardingStale();

    if (cached) {
      if (isStale && !dataCache.isPendingUpdate("onboarding")) {
        dataCache.setPendingUpdate("onboarding");
        this.getOnboardingData()
          .catch(() => {})
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
    if (typeof uri !== 'string' || !uri) {
      throw new Error("Invalid file URI");
    }
    
    const formData = new FormData();
    const normalizedUri =
      Platform.OS === "ios" ? uri.replace("file://", "") : uri;
    const sanitizedFileName = sanitizeFileName(fileName || `photo_${Date.now()}`);
    const ensuredFileName = sanitizedFileName.includes(".")
      ? sanitizedFileName
      : `${sanitizedFileName}.jpg`;
    const ensuredMime = (mimeType && /^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(mimeType))
      ? mimeType
      : "image/jpeg";
    
    formData.append("file", {
      uri: normalizedUri,
      name: ensuredFileName,
      type: ensuredMime,
    } as any);
    
    formData.append("barcode", barcode ? sanitizeBarcode(barcode) : "");
    formData.append("meal_name", mealName ? sanitizeString(mealName, 200) : "");
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
    const sanitizedPayload: ManualMealPayload = {
      meal_name: sanitizeString(payload.meal_name || "", 200),
      calories: sanitizeNumber(payload.calories, 0, 100000) ?? null,
      protein: sanitizeNumber(payload.protein, 0, 100000) ?? null,
      fat: sanitizeNumber(payload.fat, 0, 100000) ?? null,
      carbs: sanitizeNumber(payload.carbs, 0, 100000) ?? null,
      fiber: sanitizeNumber(payload.fiber, 0, 100000) ?? null,
      sugar: sanitizeNumber(payload.sugar, 0, 100000) ?? null,
      sodium: sanitizeNumber(payload.sodium, 0, 100000) ?? null,
      health_score: sanitizeNumber(payload.health_score, 0, 100) ?? null,
      created_at: payload.created_at || getLocalISOString(),
    };
    
    if (!sanitizedPayload.meal_name) {
      throw new Error("Название блюда обязательно");
    }
    
    const localTimestamp = sanitizedPayload.created_at;
    const data = {
      ...sanitizedPayload,
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
    const code = sanitizeBarcode(barcode);
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
        throw new Error(fallbackError?.message || "Не удалось найти продукт");
      }
    }
  }

  async addWater(payload: WaterPayload) {
    const sanitizedAmount = sanitizeNumber(payload.amount_ml, 1, 10000);
    if (sanitizedAmount === null) {
      throw new Error("Объём воды должен быть от 1 до 10000 мл");
    }
    
    const sanitizedGoal = payload.goal_ml ? sanitizeNumber(payload.goal_ml, 0, 10000) : null;
    
    const localTimestamp = payload.created_at || getLocalISOString();
    const data = {
      amount_ml: sanitizedAmount,
      goal_ml: sanitizedGoal,
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
          .catch(() => {})
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
    const sanitizedSkip = Math.max(0, Math.floor(sanitizeNumber(skip, 0, 10000) ?? 0));
    const sanitizedLimit = Math.max(1, Math.min(100, Math.floor(sanitizeNumber(limit, 1, 100) ?? 100)));
    
    const key = `meal-photos-${sanitizedSkip}-${sanitizedLimit}`;
    return this.dedupRequest(key, async () => {
      const response = await this.api.get<MealPhoto[]>(API_ENDPOINTS.MEALS_PHOTOS, {
        params: { skip: sanitizedSkip, limit: sanitizedLimit },
      });
      return response.data;
    });
  }

  async getMealPhotosCached(
    skip: number = 0,
    limit: number = 100,
    ttlMs: number = 30000
  ): Promise<MealPhoto[]> {
    const sanitizedSkip = Math.max(0, Math.floor(sanitizeNumber(skip, 0, 10000) ?? 0));
    const sanitizedLimit = Math.max(1, Math.min(100, Math.floor(sanitizeNumber(limit, 1, 100) ?? 100)));
    const sanitizedTtl = Math.max(0, Math.min(300000, sanitizeNumber(ttlMs, 0, 300000) ?? 30000));
    
    const now = Date.now();
    const isCacheValid =
      this.mealPhotosCache.timestamp &&
      now - (this.mealPhotosCache.timestamp || 0) < sanitizedTtl &&
      sanitizedSkip === 0;

    if (isCacheValid) {
      return this.mealPhotosCache.data.slice(0, sanitizedLimit);
    }

    const data = await this.getMealPhotos(sanitizedSkip, sanitizedLimit);
    if (sanitizedSkip === 0) {
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
      dataCache.setDailyMeals(date, response.data);
      return response.data;
    });
  }

  async getDailyMealsCached(
    date: string,
    tzOffsetMinutes: number = getLocalTimezoneOffset()
  ): Promise<{ data: DailyMealsData | null; isFromCache: boolean; isStale: boolean }> {
    const cached = dataCache.getDailyMeals(date);
    const isStale = dataCache.isDailyMealsStale(date);

    if (cached) {
      if (isStale && !dataCache.isPendingUpdate(`daily-${date}`)) {
        dataCache.setPendingUpdate(`daily-${date}`);
        this.getDailyMeals(date, tzOffsetMinutes)
          .catch(() => {})
          .finally(() => dataCache.clearPendingUpdate(`daily-${date}`));
      }
      return { data: cached, isFromCache: true, isStale };
    }

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
      for (const item of response.data) {
        const cached = dataCache.getDailyMeals(item.date);
        if (cached) {
          cached.total_calories = item.total_calories;
          cached.total_protein = item.total_protein;
          cached.total_fat = item.total_fat;
          cached.total_carbs = item.total_carbs;
        }
      }
      return response.data;
    });
  }

  async getDailyMealsBatchCached(
    dates: string[],
    weekKey: string,
    tzOffsetMinutes: number = getLocalTimezoneOffset()
  ): Promise<{ data: Array<{ date: string; total_calories: number; total_protein: number; total_fat: number; total_carbs: number }> | null; isFromCache: boolean }> {
    const weekData = dataCache.getWeekData(weekKey);
    const isStale = dataCache.isWeekStale(weekKey);

    if (weekData && !isStale) {
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
      
      if (isStale && !dataCache.isPendingUpdate(`week-${weekKey}`)) {
        dataCache.setPendingUpdate(`week-${weekKey}`);
        this.getDailyMealsBatch(dates, tzOffsetMinutes)
          .catch(() => {})
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
    if (!Number.isInteger(photoId) || photoId <= 0) {
      throw new Error("Invalid photo ID");
    }
    
    await this.api.delete(`${API_ENDPOINTS.MEALS_PHOTO}/${photoId}`);
    this.removeMealPhotoFromCache(photoId);
    dataCache.invalidateDailyMeals(getLocalDateStr());
  }

  getMealPhotoUrl(photoId: number, token?: string): string {
    if (!Number.isInteger(photoId) || photoId <= 0) {
      throw new Error("Invalid photo ID");
    }
    
    const sanitizedToken = token ? encodeURIComponent(sanitizeString(token, 500)) : "";
    const qs = sanitizedToken ? `?token=${sanitizedToken}` : "";
    return `${API_BASE_URL}${API_ENDPOINTS.MEALS_PHOTO}/${photoId}${qs}`;
  }

  async updateMealPhoto(photoId: number, data: {
    meal_name?: string;
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
  }): Promise<MealPhoto> {
    if (!Number.isInteger(photoId) || photoId <= 0) {
      throw new Error("Invalid photo ID");
    }
    
    const sanitizedData = {
      meal_name: data.meal_name ? sanitizeString(data.meal_name, 200) : undefined,
      calories: data.calories !== undefined ? sanitizeNumber(data.calories, 0, 100000) : undefined,
      protein: data.protein !== undefined ? sanitizeNumber(data.protein, 0, 100000) : undefined,
      fat: data.fat !== undefined ? sanitizeNumber(data.fat, 0, 100000) : undefined,
      carbs: data.carbs !== undefined ? sanitizeNumber(data.carbs, 0, 100000) : undefined,
    };
    
    const response = await this.api.put<MealPhoto>(
      `${API_ENDPOINTS.MEALS_PHOTO}/${photoId}`,
      sanitizedData,
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
    if (!Number.isInteger(photoId) || photoId <= 0) {
      throw new Error("Invalid photo ID");
    }
    
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
      throw new Error(
        error.code === "ECONNABORTED" || error.message?.includes("timeout")
          ? "Сервер не отвечает. Проверьте, что бэкенд запущен."
          : error.code === "ECONNREFUSED"
          ? "Не удалось подключиться к серверу. Проверьте URL и что сервер запущен."
          : "Ошибка подключения к серверу"
      );
    }
  }

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
    const sanitizedData = {
      first_name: data.first_name ? sanitizeString(data.first_name, 100) : undefined,
      last_name: data.last_name ? sanitizeString(data.last_name, 100) : undefined,
      username: data.username ? sanitizeString(data.username.toLowerCase().replace(/[^a-z0-9_]/g, ''), 50) : undefined,
      avatar_url: data.avatar_url ? sanitizeUrl(data.avatar_url) : null,
    };
    
    const response = await this.api.put(`${API_ENDPOINTS.AUTH}/profile`, sanitizedData);
    return response.data;
  }

  async checkUsername(username: string): Promise<{
    username: string;
    available: boolean;
    message: string;
  }> {
    const sanitized = sanitizeString(username.toLowerCase().replace(/[^a-z0-9_]/g, ''), 50);
    if (!sanitized || sanitized.length < 3) {
      throw new Error("Username должен быть минимум 3 символа");
    }
    const response = await this.api.post(`${API_ENDPOINTS.AUTH}/check-username`, { username: sanitized });
    return response.data;
  }

  async uploadAvatar(
    uri: string,
    fileName: string,
    mimeType: string
  ): Promise<{ avatar_url: string; message: string }> {
    if (typeof uri !== 'string' || !uri) {
      throw new Error("Invalid file URI");
    }
    
    const formData = new FormData();
    const normalizedUri =
      Platform.OS === "ios" ? uri.replace("file://", "") : uri;
    const sanitizedFileName = sanitizeFileName(fileName || `avatar_${Date.now()}`);
    const ensuredFileName = sanitizedFileName.includes(".")
      ? sanitizedFileName
      : `${sanitizedFileName}.jpg`;
    const ensuredMime = (mimeType && /^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(mimeType))
      ? mimeType
      : "image/jpeg";
    
    formData.append("file", {
      uri: normalizedUri,
      name: ensuredFileName,
      type: ensuredMime,
    } as any);

    const response = await this.api.post<{ avatar_url: string; message: string }>(
      `${API_ENDPOINTS.AUTH}/upload-avatar`, 
      formData, 
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      }
    );
    
    return response.data;
  }

  async addWeightLog(weight: number, created_at?: string): Promise<{
    id: number;
    user_id: number;
    weight: number;
    created_at: string;
  }> {
    const sanitizedWeight = sanitizeNumber(weight, 30, 300);
    if (sanitizedWeight === null) {
      throw new Error("Вес должен быть от 30 до 300 кг");
    }
    
    const response = await this.api.post('/api/v1/progress/weight', {
      weight: sanitizedWeight,
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
    const sanitizedLimit = Math.max(1, Math.min(1000, Math.floor(sanitizeNumber(limit, 1, 1000) ?? 100)));
    
    const response = await this.api.get('/api/v1/progress/weight/history', {
      params: { limit: sanitizedLimit },
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
    if (typeof uri !== 'string' || !uri) {
      throw new Error("Invalid file URI");
    }
    
    const formData = new FormData();
    const normalizedUri = Platform.OS === "ios" ? uri.replace("file://", "") : uri;
    const sanitizedFileName = sanitizeFileName(fileName || `photo_${Date.now()}`);
    const ensuredFileName = sanitizedFileName.includes(".")
      ? sanitizedFileName
      : `${sanitizedFileName}.jpg`;
    const ensuredMime = (mimeType && /^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(mimeType))
      ? mimeType
      : "image/jpeg";
    
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
    if (!Number.isInteger(photoId) || photoId <= 0) {
      throw new Error("Invalid photo ID");
    }
    
    return `${API_BASE_URL}/api/v1/progress/photos/${photoId}`;
  }

  async deleteProgressPhoto(photoId: number): Promise<void> {
    if (!Number.isInteger(photoId) || photoId <= 0) {
      throw new Error("Invalid photo ID");
    }
    
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
    if (!Number.isInteger(photoId) || photoId <= 0) {
      throw new Error("Invalid photo ID");
    }
    
    const sanitizedIngredient = {
      name: sanitizeString(ingredient.name || "", 200),
      calories: sanitizeNumber(ingredient.calories, 0, 100000) ?? 0,
    };
    
    if (!sanitizedIngredient.name) {
      throw new Error("Название ингредиента обязательно");
    }
    
    const response = await this.api.post(
      `${API_ENDPOINTS.MEALS_PHOTO}/${photoId}/ingredients`,
      sanitizedIngredient
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
    if (!Number.isInteger(photoId) || photoId <= 0) {
      throw new Error("Invalid photo ID");
    }
    
    const sanitizedCorrection = sanitizeString(correction, 1000);
    if (!sanitizedCorrection) {
      throw new Error("Корректировка не может быть пустой");
    }
    
    const response = await this.api.post(
      `${API_ENDPOINTS.MEALS_PHOTO}/${photoId}/correct`,
      { correction: sanitizedCorrection }
    );
    dataCache.invalidateDailyMeals(getLocalDateStr());
    return response.data;
  }

  async generateRecipe(
    prompt: string
  ): Promise<{
    recipe: {
      name: string;
      description: string;
      meal_type?: string;
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
      time: number;
      difficulty: string;
      ingredients: string[];
      instructions: string[];
    };
    meal_id: number;
    added_to_diet: boolean;
  }> {
    const sanitizedPrompt = sanitizeString(prompt, 500);
    
    if (!sanitizedPrompt) {
      throw new Error("Опишите желаемый рецепт");
    }
    
    const response = await this.api.post("/api/v1/meals/recipes/generate", {
      prompt: sanitizedPrompt,
    });
    
    dataCache.invalidateDailyMeals(getLocalDateStr());
    return response.data;
  }

  async getPopularRecipes(limit: number = 10): Promise<Array<{
    name: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    count: number;
  }>> {
    const response = await this.api.get('/api/v1/meals/recipes/popular', {
      params: { limit: Math.min(limit, 50) },
    });
    return response.data;
  }
}

export const apiService = new ApiService();
