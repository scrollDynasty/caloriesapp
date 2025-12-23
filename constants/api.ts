
import Constants from "expo-constants";

export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  "https://api.yeb-ich.com";

export const API_ENDPOINTS = {
  
  AUTH: "/api/v1/auth",
  AUTH_GOOGLE: "/api/v1/auth/google",
  AUTH_APPLE: "/api/v1/auth/apple",
  AUTH_ME: "/api/v1/auth/me",

  ONBOARDING: "/api/v1/onboarding",

  MEALS_UPLOAD: "/api/v1/meals/upload",
  MEALS_PHOTOS: "/api/v1/meals/photos",
  MEALS_PHOTO: "/api/v1/meals/photos",
  MEALS_DAILY: "/api/v1/meals/daily",
  MEALS_DAILY_BATCH: "/api/v1/meals/daily/batch",
  MEALS_MANUAL: "/api/v1/meals/manual",
  WATER: "/api/v1/water",
  WATER_DAILY: "/api/v1/water/daily",

  HEALTH: "/health",
} as const;
