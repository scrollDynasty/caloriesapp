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
      if (params.error) {
        setError("Ошибка авторизации через Google");
        setTimeout(() => router.replace("/save-progress"), 2000);
        return;
      }

      const token = params.token as string;
      let userStr = params.user as string;

      if (!token || !userStr) {
        setError("Ошибка авторизации: отсутствуют данные");
        setTimeout(() => router.replace("/save-progress"), 2000);
        return;
      }

      userStr = decodeURIComponent(userStr);
      userStr = userStr.replace(/#.*$/, "");

      const user = JSON.parse(userStr);

      // Сохраняем токен
      await apiService.saveToken(token);

      // Сохраняем данные онбординга
      try {
        await saveOnboardingData(onboardingData);
      } catch (saveError) {
        console.error("Ошибка сохранения данных онбординга:", saveError);
        // Продолжаем даже если сохранение не удалось
      }

      // Переход на главный экран
      router.replace("/(tabs)");
    } catch (err) {
      console.error("Callback error:", err);
      setError("Ошибка при обработке данных авторизации");
      setTimeout(() => router.replace("/save-progress"), 2000);
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
