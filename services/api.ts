/**
 * API сервис для работы с бэкендом
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AxiosResponse } from "axios";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { Platform } from "react-native";
import { API_BASE_URL, API_ENDPOINTS } from "../constants/api";

const TASHKENT_OFFSET_MINUTES = 300; // UTC+5

// Ключ для хранения токена
const TOKEN_KEY = "@caloriesapp:auth_token";

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

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // Увеличиваем таймаут до 30 секунд
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Интерцептор для добавления токена к запросам
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

    // Интерцептор для обработки ошибок
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Авто-логаут и очистка токена при 401
          await this.removeToken();
        }
        return Promise.reject(error);
      }
    );

    // Загружаем токен из AsyncStorage при инициализации
    this.loadTokenFromStorage();
  }

  // Загрузка токена из AsyncStorage в кэш
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

  // Работа с токеном
  async saveToken(token: string): Promise<void> {
    try {
      // Сохраняем в кэш немедленно
      this.cachedToken = token;
      // Асинхронно сохраняем в AsyncStorage
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error("Ошибка сохранения токена:", error);
    }
  }

  async getToken(): Promise<string | null> {
    // Сначала проверяем кэш (быстро и надёжно)
    if (this.cachedToken) {
      return this.cachedToken;
    }
    // Если кэш пуст, пробуем загрузить из AsyncStorage
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

  // Аутентификация
  async authGoogle(idToken: string) {
    const response = await this.api.post(API_ENDPOINTS.AUTH_GOOGLE, {
      id_token: idToken,
    });
    const { access_token, user_id } = response.data;
    // Важно: сохраняем токен и ждём завершения
    await this.saveToken(access_token);
    return { token: access_token, userId: user_id };
  }

  async authApple(idToken: string, authorizationCode?: string) {
    const response = await this.api.post(API_ENDPOINTS.AUTH_APPLE, {
      id_token: idToken,
      authorization_code: authorizationCode,
    });
    const { access_token, user_id } = response.data;
    // Важно: сохраняем токен и ждём завершения
    await this.saveToken(access_token);
    return { token: access_token, userId: user_id };
  }

  async getCurrentUser() {
    const response = await this.api.get(API_ENDPOINTS.AUTH_ME);
    return response.data;
  }

  // Данные онбординга
  async saveOnboardingData(data: any) {
    const response = await this.api.post(API_ENDPOINTS.ONBOARDING, data);
    return response.data;
  }

  async getOnboardingData() {
    const response = await this.api.get(API_ENDPOINTS.ONBOARDING);
    return response.data;
  }

  // Фотографии еды
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
    formData.append("client_tz_offset_minutes", String(TASHKENT_OFFSET_MINUTES));

    const response = await this.api.post<MealPhotoUploadResponse>(API_ENDPOINTS.MEALS_UPLOAD, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 20000,
    });
    
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
        client_tz_offset_minutes: TASHKENT_OFFSET_MINUTES,
      },
    });
    return response.data as MealPhoto;
  }

  async addWater(payload: WaterPayload) {
    const data = {
      ...payload,
      created_at: payload.created_at || new Date().toISOString(),
    };
    const response = await this.api.post(API_ENDPOINTS.WATER, data, {
      params: { tz_offset_minutes: TASHKENT_OFFSET_MINUTES },
    });
    return response.data as WaterEntry;
  }

  async getDailyWater(
    date: string,
    tzOffsetMinutes: number = TASHKENT_OFFSET_MINUTES
  ): Promise<WaterDaily> {
    const response = await this.api.get(API_ENDPOINTS.WATER_DAILY, {
      params: { date, tz_offset_minutes: tzOffsetMinutes },
    });
    return response.data as WaterDaily;
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
    tzOffsetMinutes: number = TASHKENT_OFFSET_MINUTES
  ): Promise<{
    date: string;
    total_calories: number;
    total_protein: number;
    total_fat: number;
    total_carbs: number;
    meals: Array<{
      id: number;
      name: string;
      time: string;
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    }>;
  }> {
    const response = await this.api.get(API_ENDPOINTS.MEALS_DAILY, {
      params: { date, tz_offset_minutes: tzOffsetMinutes },
    });
    return response.data;
  }

  async deleteMealPhoto(photoId: number) {
    await this.api.delete(`${API_ENDPOINTS.MEALS_PHOTO}/${photoId}`);
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
    return response.data;
  }

  // Проверка здоровья сервера
  async healthCheck() {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.HEALTH}`, {
        timeout: 5000, // Короткий таймаут для проверки
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
