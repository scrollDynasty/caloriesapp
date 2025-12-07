/**
 * Конфигурация API
 */
import Constants from "expo-constants";

// Базовый URL API
// Для разработки используйте ваш локальный IP (например, http://192.168.100.13:8000)
// Для продакшена укажите реальный URL
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://192.168.100.13:8000"; // Замените на ваш локальный IP

export const API_ENDPOINTS = {
  // Аутентификация
  AUTH_GOOGLE: "/api/v1/auth/google",
  AUTH_APPLE: "/api/v1/auth/apple",
  AUTH_ME: "/api/v1/auth/me",
  
  // Данные онбординга
  ONBOARDING: "/api/v1/onboarding",
  
  // Системные
  HEALTH: "/health",
} as const;
