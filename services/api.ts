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
import { API_BASE_URL, API_ENDPOINTS } from "../constants/api";

// Ключ для хранения токена
const TOKEN_KEY = "@caloriesapp:auth_token";

class ApiService {
  private api: AxiosInstance;
  // Храним токен в памяти для быстрого доступа (избегаем race condition с AsyncStorage)
  private cachedToken: string | null = null;

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
        // НЕ удаляем токен автоматически при 401 - это вызывает проблемы
        // Токен будет удалён только при явном выходе
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
