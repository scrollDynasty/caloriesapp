/**
 * Сервис авторизации через Google и Apple
 */
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { apiService } from "./api";

// Завершаем сессию веб-браузера после OAuth
WebBrowser.maybeCompleteAuthSession();

export class AuthService {
  /**
   * Авторизация через Google
   */
  async signInWithGoogle(): Promise<{ 
    success: boolean; 
    error?: string; 
    token?: string; 
    user?: any;
  }> {
    try {
      const { API_BASE_URL } = await import("../constants/api");
      
      // Redirect URI для мобильного приложения
      // В Expo Go будет exp://, в production build - caloriesapp://
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: "caloriesapp",
        path: "auth/callback",
      });

      // Формируем URL для Google OAuth через бэкенд
      const authUrl = `${API_BASE_URL}/api/v1/auth/google?state=${encodeURIComponent(redirectUri)}`;

      // Открываем браузер для авторизации
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      if (result.type === "success") {
        // Извлекаем токен и данные пользователя из URL
        const url = result.url;
        
        if (url.includes('token=')) {
          const tokenMatch = url.match(/token=([^&]+)/);
          const userMatch = url.match(/user=([^&#]+)/);
          
          if (tokenMatch && userMatch) {
            const token = decodeURIComponent(tokenMatch[1]);
            let userStr = decodeURIComponent(userMatch[1]);
            userStr = userStr.replace(/#.*$/, '');
            const user = JSON.parse(userStr);
            
            // Сохраняем токен
            await apiService.saveToken(token);
            
            return { 
              success: true, 
              token,
              user 
            };
          }
          
          return { success: false, error: "Не удалось извлечь данные из ответа" };
        }
        
        return { success: false, error: "Ответ не содержит токен" };
      } else if (result.type === "cancel") {
        return { success: false, error: "Вход отменён" };
      } else if (result.type === "dismiss") {
        return { success: false, error: "Окно входа закрыто" };
      }

      return { success: false, error: "Не удалось получить токен" };
    } catch (error: any) {
      console.error("Auth error:", error);
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
