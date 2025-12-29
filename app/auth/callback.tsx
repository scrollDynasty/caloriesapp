import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
      if (__DEV__) {
        console.log("🔍 Callback received with params:", JSON.stringify(params, null, 2));
      }
      
      if (params.error) {
        if (__DEV__) console.error("❌ OAuth error:", params.error);
        if (isMounted.current) {
          setError(`Ошибка авторизации: ${params.error}`);
        }
        safeRedirect("/save-progress");
        return;
      }

      const token = params.token as string;
      let userStr = params.user as string;

      if (__DEV__) {
        console.log("📦 Token present:", !!token);
        console.log("📦 User string present:", !!userStr);
      }

      if (!token || !userStr) {
        if (__DEV__) {
          console.error("❌ Missing data - token:", !!token, "user:", !!userStr);
          console.error("❌ All params:", Object.keys(params));
        }
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
        
        if (__DEV__) {
          console.log("✅ User data parsed:", { email: user.email, user_id: user.user_id });
        }

        await apiService.saveToken(token);
        if (__DEV__) console.log("✅ Token saved");

        let hasExistingData = false;
        try {
          const existingData = await apiService.getOnboardingData();
          if (existingData && Object.keys(existingData).length > 0) {
            hasExistingData = true;
            if (__DEV__) console.log("ℹ️ Onboarding data already exists on server, skipping save");
          }
        } catch (error: any) {
          if (error?.response?.status !== 404 && __DEV__) {
            console.warn("⚠️ Error checking existing data:", error);
          }
        }

        if (!hasExistingData) {
          let dataToSave = onboardingData;
          
          try {
            const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
            const storedData = await AsyncStorage.getItem("@yebich:onboarding_data");
            if (storedData) {
              const parsedData = JSON.parse(storedData);
              if (parsedData && Object.keys(parsedData).length > 0) {
                dataToSave = { ...onboardingData, ...parsedData };
                if (__DEV__) console.log("📦 Found onboarding data in storage, merging with context");
              }
            }
          } catch (storageError) {
            if (__DEV__) console.warn("⚠️ Error reading stored data:", storageError);
          }
          
          if (dataToSave && Object.keys(dataToSave).length > 0) {
            try {
              if (__DEV__) console.log("💾 Saving onboarding data (first time)...");
              const saveResult = await saveOnboardingData(dataToSave);
              if (saveResult.success) {
                if (__DEV__) console.log("✅ Onboarding data saved");
                try {
                  const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
                  await AsyncStorage.removeItem("@yebich:onboarding_data");
                } catch (e) {
                  if (__DEV__) console.warn("⚠️ Error clearing stored data:", e);
                }
              } else if (__DEV__) {
                console.warn("⚠️ Onboarding save failed:", saveResult.error);
              }
            } catch (saveError: any) {
              if (__DEV__) console.error("❌ Ошибка сохранения данных онбординга:", saveError);
            }
          } else if (__DEV__) {
            console.log("ℹ️ No onboarding data to save");
          }
        }

        if (__DEV__) console.log("🚀 Redirecting to main screen...");
        if (isMounted.current) {
          router.replace("/(tabs)");
        }
      } catch (parseError: any) {
        if (__DEV__) {
          console.error("❌ Error parsing user data:", parseError);
        }
        if (isMounted.current) {
          setError("Ошибка при обработке данных");
        }
        safeRedirect("/save-progress");
      }
    } catch (err: any) {
      if (__DEV__) {
        console.error("❌ Callback error:", err);
      }
      if (isMounted.current) {
        setError(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
      }
      safeRedirect("/save-progress");
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
