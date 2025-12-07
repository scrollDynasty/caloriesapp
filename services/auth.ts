/**
 * Сервис авторизации через Google и Apple
 */
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { apiService } from "./api";

// Завершаем сессию веб-браузера после OAuth
WebBrowser.maybeCompleteAuthSession();

// Google OAuth конфигурация
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";

// Discovery endpoints для Google
const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

export class AuthService {
  /**
   * Авторизация через Google
   */
  async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      const { API_BASE_URL } = await import("../constants/api");
      
      // Redirect URI для мобильного приложения
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: "caloriesapp",
        path: "auth/callback",
      });

      // Формируем URL для Google OAuth через бэкенд
      const authUrl = `${API_BASE_URL}/api/v1/auth/google?state=${encodeURIComponent(redirectUri)}`;

      // Открываем браузер для авторизации
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === "success") {
        // Если успешно, callback экран обработает результат
        // Просто возвращаем success, callback.tsx сделает остальное
        return { success: true };
      } else if (result.type === "cancel") {
        return { success: false, error: "Вход отменён" };
      }

      return { success: false, error: "Не удалось получить токен" };
    } catch (error: any) {
      console.error("Ошибка авторизации:", error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || "Ошибка авторизации",
      };
    }
  }

  /**
   * Авторизация через Apple
   */
  async signInWithApple(): Promise<{ success: boolean; error?: string }> {
    try {
      if (Platform.OS !== "ios") {
        return {
          success: false,
          error: "Apple Sign In доступен только на iOS",
        };
      }

      return {
        success: false,
        error: "Apple Sign In пока не реализован. Используйте Google.",
      };
    } catch (error: any) {
      console.error("Ошибка авторизации:", error);
      return {
        success: false,
        error: error.message || "Ошибка авторизации",
      };
    }
  }

  /**
   * Выход из аккаунта
   */
  async signOut(): Promise<void> {
    await apiService.removeToken();
  }

  /**
   * Проверка авторизации
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await apiService.getToken();
    return !!token;
  }
}

export const authService = new AuthService();
