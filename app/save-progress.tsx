import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthButton } from "../components/ui/AuthButton";
import { colors } from "../constants/theme";
import { useOnboarding } from "../context/OnboardingContext";
import { useFonts } from "../hooks/use-fonts";
import { authService } from "../services/auth";

export default function SaveProgress() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const { data: onboardingData } = useOnboarding();
  const [loading, setLoading] = useState(false);

  if (!fontsLoaded) {
    return null;
  }

  const handleAppleAuth = async () => {
    setLoading(true);
    try {
      const result = await authService.signInWithApple();
      
      if (result.success) {

        return;
      } else {
        Alert.alert("Ошибка", result.error || "Не удалось войти через Apple");
      }
    } catch (error: any) {
      if (__DEV__) console.error("Ошибка авторизации:", error);
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

        router.replace("/(tabs)");
      } else {
        
        const errorMessage = result.error || "Не удалось войти через Google";
        Alert.alert(
          "Ошибка авторизации",
          errorMessage,
          [
            {
              text: "OK",
              style: "default",
            },
          ],
          { cancelable: true }
        );
      }
    } catch (error: any) {
      if (__DEV__) console.error("Auth error:", error);
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
        {}
        <View style={styles.contentContainer}>
          {}
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="save-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.mainTitle}>Сохраните прогресс</Text>
            <Text style={styles.subtitle}>
              Создайте аккаунт, чтобы не потерять свой персональный план
            </Text>
          </View>

          {}
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

        {}
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
    backgroundColor: colors.white,
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
