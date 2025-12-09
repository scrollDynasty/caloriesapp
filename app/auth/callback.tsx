import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";
import { useOnboarding } from "../../context/OnboardingContext";
import { apiService } from "../../services/api";
import { saveOnboardingData } from "../../services/onboarding";

export default function CallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { data: onboardingData } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      console.log("🔍 Callback received with params:", JSON.stringify(params, null, 2));
      
      if (params.error) {
        console.error("❌ OAuth error:", params.error);
        setError(`Ошибка авторизации: ${params.error}`);
        setTimeout(() => router.replace("/save-progress"), 3000);
        return;
      }

      const token = params.token as string;
      let userStr = params.user as string;

      console.log("📦 Token present:", !!token);
      console.log("📦 User string present:", !!userStr);

      if (!token || !userStr) {
        console.error("❌ Missing data - token:", !!token, "user:", !!userStr);
        console.error("❌ All params:", Object.keys(params));
        setError("Ошибка: отсутствуют данные авторизации");
        setTimeout(() => router.replace("/save-progress"), 3000);
        return;
      }

      try {
        userStr = decodeURIComponent(userStr);
        userStr = userStr.replace(/#.*$/, "");
        const user = JSON.parse(userStr);
        
        console.log("✅ User data parsed:", { email: user.email, user_id: user.user_id });

        // Сохраняем токен
        await apiService.saveToken(token);
        console.log("✅ Token saved");

        // Проверяем, есть ли уже данные онбординга на сервере
        let hasExistingData = false;
        try {
          const existingData = await apiService.getOnboardingData();
          if (existingData && Object.keys(existingData).length > 0) {
            hasExistingData = true;
            console.log("ℹ️ Onboarding data already exists on server, skipping save");
          }
        } catch (error: any) {
          if (error?.response?.status !== 404) {
            console.warn("⚠️ Error checking existing data:", error);
          }
        }

        // Если данных нет на сервере, сохраняем из контекста (для новых пользователей)
        if (!hasExistingData) {
          if (onboardingData && Object.keys(onboardingData).length > 0) {
            try {
              console.log("💾 Saving onboarding data (first time)...");
              const saveResult = await saveOnboardingData(onboardingData);
              if (saveResult.success) {
                console.log("✅ Onboarding data saved");
              } else {
                console.warn("⚠️ Onboarding save failed:", saveResult.error);
              }
            } catch (saveError: any) {
              console.error("❌ Ошибка сохранения данных онбординга:", saveError);
            }
          } else {
            console.log("ℹ️ No onboarding data in context to save");
          }
        }

        // Переход на главный экран
        console.log("🚀 Redirecting to main screen...");
        router.replace("/(tabs)");
      } catch (parseError: any) {
        console.error("❌ Error parsing user data:", parseError);
        console.error("❌ User string:", userStr);
        setError("Ошибка при обработке данных");
        setTimeout(() => router.replace("/save-progress"), 3000);
      }
    } catch (err: any) {
      console.error("❌ Callback error:", err);
      console.error("❌ Error stack:", err.stack);
      setError(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
      setTimeout(() => router.replace("/save-progress"), 3000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        <>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.subText}>Перенаправление на страницу входа...</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Авторизация...</Text>
          <Text style={styles.subText}>Пожалуйста, подождите</Text>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.secondary,
    fontFamily: "Inter_400Regular",
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "Inter_600SemiBold",
  },
});
