import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LottieLoader } from "../../components/ui/LottieLoader";
import { useOnboarding } from "../../context/OnboardingContext";
import { useTheme } from "../../context/ThemeContext";
import { apiService } from "../../services/api";
import { saveOnboardingData } from "../../services/onboarding";

export default function CallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { data: onboardingData } = useOnboarding();
  const { colors, isDark } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMounted.current = true;
    handleCallback();
    
    return () => {
      isMounted.current = false;
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const safeRedirect = (path: string, delay: number = 3000) => {
    redirectTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        router.replace(path as any);
      }
    }, delay);
  };

  const handleCallback = async () => {
    try {
      if (params.error) {
        if (isMounted.current) {
          setError(`Ошибка авторизации: ${params.error}`);
        }
        safeRedirect("/save-progress");
        return;
      }

      const token = params.token as string;
      let userStr = params.user as string;

      if (!token || !userStr) {
        if (isMounted.current) {
          setError("Ошибка: отсутствуют данные авторизации");
        }
        safeRedirect("/save-progress");
        return;
      }

      try {
        userStr = decodeURIComponent(userStr);
        userStr = userStr.replace(/#.*$/, "");
        const user = JSON.parse(userStr);

        await apiService.saveToken(token);

        let hasExistingData = false;
        try {
          const existingData = await apiService.getOnboardingData();
          if (existingData && Object.keys(existingData).length > 0) {
            hasExistingData = true;
          }
        } catch {

        }

        if (!hasExistingData) {
          let dataToSave = onboardingData;
          
          try {
            const storedData = await AsyncStorage.getItem("@yebich:onboarding_data");
            if (storedData) {
              const parsedData = JSON.parse(storedData);
              if (parsedData && Object.keys(parsedData).length > 0) {
                dataToSave = { ...onboardingData, ...parsedData };
              }
            }
          } catch {
          }
          
          if (dataToSave && Object.keys(dataToSave).length > 0) {
            try {
              const saveResult = await saveOnboardingData(dataToSave);
              if (saveResult.success) {
                try {
                  await AsyncStorage.removeItem("@yebich:onboarding_data");
                } catch {
                }
              }
            } catch {
            }
          }
        }
        if (isMounted.current) {
          router.replace("/(tabs)");
        }
      } catch {
        if (isMounted.current) {
          setError("Ошибка при обработке данных");
        }
        safeRedirect("/save-progress");
      }
    } catch {
      if (isMounted.current) {
        setError("Ошибка: Неизвестная ошибка");
      }
      safeRedirect("/save-progress");
    }
  };

  return (
    <LinearGradient
      colors={isDark ? ["#1a1a1a", "#2d2d2d"] : ["#FFFFF0", "#F5F5E8"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {error ? (
          <View style={[styles.card, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.9)" }]}>
            <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={styles.blurCard}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={[styles.errorText, { color: isDark ? "#ff6b6b" : "#d32f2f" }]}>{error}</Text>
              <Text style={[styles.subText, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>Перенаправление на страницу входа...</Text>
            </BlurView>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.9)" }]}>
            <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={styles.blurCard}>
              <LottieLoader size="large" />
              <Text style={[styles.loadingText, { color: isDark ? colors.text : colors.primary }]}>Авторизация...</Text>
              <Text style={[styles.subText, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>Пожалуйста, подождите</Text>
            </BlurView>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 280,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  blurCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  loadingText: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  subText: {
    marginTop: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  errorIcon: {
    fontSize: 56,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
