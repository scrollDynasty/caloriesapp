/**
 * Конфигурация API
 */
import Constants from "expo-constants";

// Базовый URL API
// Продакшен: https://api.yeb-ich.com
// Для локальной разработки можно переопределить через EXPO_PUBLIC_API_URL
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  "https://api.yeb-ich.com";

export const API_ENDPOINTS = {
  // Аутентификация
  AUTH_GOOGLE: "/api/v1/auth/google",
  AUTH_APPLE: "/api/v1/auth/apple",
  AUTH_ME: "/api/v1/auth/me",
  
  // Данные онбординга
  ONBOARDING: "/api/v1/onboarding",
  
  // Фотографии еды
  MEALS_UPLOAD: "/api/v1/meals/upload",
  MEALS_PHOTOS: "/api/v1/meals/photos",
  MEALS_PHOTO: "/api/v1/meals/photos",
  MEALS_DAILY: "/api/v1/meals/daily",
  
  // Системные
  HEALTH: "/health",
} as const;
