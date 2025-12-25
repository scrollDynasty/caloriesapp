
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { apiService } from "./api";

WebBrowser.maybeCompleteAuthSession();

export class AuthService {
  
  async signInWithGoogle(): Promise<{ 
    success: boolean; 
    error?: string; 
    token?: string; 
    user?: any;
  }> {
    try {
      const { API_BASE_URL } = await import("../constants/api");

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: "caloriesapp",
        path: "auth/callback",
      });

      const authUrl = `${API_BASE_URL}/api/v1/auth/google?state=${encodeURIComponent(redirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      if (result.type === "success") {
        
        const url = result.url;
        if (url.includes("error=")) {
          const errMatch = url.match(/error=([^&]+)/);
          const errMsg = errMatch ? decodeURIComponent(errMatch[1]) : "Ошибка авторизации";
          return { success: false, error: errMsg };
        }
        
        if (url.includes('token=')) {
          const tokenMatch = url.match(/token=([^&]+)/);
          const userMatch = url.match(/user=([^&#]+)/);
          
          if (tokenMatch && userMatch) {
            const token = decodeURIComponent(tokenMatch[1]);
            let userStr = decodeURIComponent(userMatch[1]);
            userStr = userStr.replace(/#.*$/, '');
            const user = JSON.parse(userStr);

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
      if (__DEV__) console.error("Auth error:", error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || "Ошибка авторизации",
      };
    }
  }

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
      if (__DEV__) console.error("Ошибка авторизации:", error);
      return {
        success: false,
        error: error.message || "Ошибка авторизации",
      };
    }
  }

  async signOut(): Promise<void> {
    await apiService.removeToken();
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await apiService.getToken();
    return !!token;
  }
}

export const authService = new AuthService();
