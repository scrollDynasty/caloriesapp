import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthButton } from "../components/ui/AuthButton";
import { useOnboarding } from "../context/OnboardingContext";
import { useTheme } from "../context/ThemeContext";
import { useFonts } from "../hooks/use-fonts";
import { authService } from "../services/auth";
import { OnboardingData, saveOnboardingData } from "../services/onboarding";

const ONBOARDING_DATA_KEY = "@yebich:onboarding_data";

export default function SaveProgress() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: onboardingData, clearData } = useOnboarding();
  const [loading, setLoading] = useState(false);
  
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 48,
    },
    contentContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 32,
    },
    headerSection: {
      alignItems: "center",
      marginBottom: 48,
      width: "100%",
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    mainTitle: {
      color: colors.primary,
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 33.88,
      textAlign: "center",
      fontFamily: "Inter_700Bold",
      marginBottom: 12,
    },
    subtitle: {
      color: colors.secondary,
      fontSize: 16,
      fontWeight: "400",
      lineHeight: 24,
      textAlign: "center",
      fontFamily: "Inter_400Regular",
      paddingHorizontal: 24,
    },
    authButtonsContainer: {
      width: "100%",
      gap: 16,
    },
    buttonSpacing: {
      height: 16,
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 16,
    },
    footerText: {
      color: colors.secondary,
      fontSize: 12,
      fontWeight: "400",
      lineHeight: 16,
      textAlign: "center",
      fontFamily: "Inter_400Regular",
    },
  });

  const cachedDataRef = useRef<Partial<OnboardingData> | null>(null);


  useEffect(() => {
    const loadAndCacheData = async () => {
      try {
        let data = { ...onboardingData };
        
        const storedData = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData && Object.keys(parsedData).length > 0) {
            data = { ...data, ...parsedData };
          }
        }
        
        cachedDataRef.current = data;
      } catch {

      }
    };
    
    loadAndCacheData();
  }, [onboardingData]);

  if (!fontsLoaded) {
    return null;
  }

  const saveOnboardingAfterAuth = async (): Promise<boolean> => {
    try {
      let dataToSave: Partial<OnboardingData> = {
        ...(cachedDataRef.current || {}),
        ...onboardingData,
      };
      
      try {
        const storedData = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData && Object.keys(parsedData).length > 0) {
            dataToSave = { ...dataToSave, ...parsedData };
          }
        }
      } catch {
      }
      
      if (!dataToSave || Object.keys(dataToSave).length === 0) {
        return true;
      }
      
      const saveResult = await saveOnboardingData(dataToSave);
      
      if (saveResult.success) {
        await AsyncStorage.removeItem(ONBOARDING_DATA_KEY).catch(() => {});
        await clearData();
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  };

  const handleAppleAuth = async () => {
    setLoading(true);
    try {
      const result = await authService.signInWithApple();
      
      if (result.success) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await saveOnboardingAfterAuth();
        router.replace("/(tabs)");
      } else {
        Alert.alert("Ошибка", result.error || "Не удалось войти через Apple");
      }
    } catch (error: any) {
      Alert.alert("Ошибка", error.message || "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (loading) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      
      if (result.success && result.token && result.user) {
        await new Promise(resolve => setTimeout(resolve, 200));
        await saveOnboardingAfterAuth();
        router.replace("/(tabs)");
      } else {
        const errorMessage = result.error || "Не удалось войти через Google";
        Alert.alert(
          "Ошибка авторизации",
          errorMessage,
          [{ text: "OK", style: "default" }],
          { cancelable: true }
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Ошибка",
        error.message || "Произошла ошибка при авторизации"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="save-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.mainTitle}>Сохраните прогресс</Text>
            <Text style={styles.subtitle}>
              Создайте аккаунт, чтобы не потерять свой персональный план
            </Text>
          </View>

          <View style={styles.authButtonsContainer}>
            <AuthButton
              provider="apple"
              onPress={handleAppleAuth}
              disabled={loading}
            />
            <View style={styles.buttonSpacing} />
            <AuthButton
              provider="google"
              onPress={handleGoogleAuth}
              disabled={loading}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Продолжая, вы соглашаетесь с Условиями использования и Политикой
            конфиденциальности
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
