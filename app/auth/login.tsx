import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthButton } from "../../components/ui/AuthButton";
import { colors } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { useFonts } from "../../hooks/use-fonts";
import { authService } from "../../services/auth";
import { showToast } from "../../utils/toast";

export default function LoginScreen() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);

  if (!fontsLoaded) return null;

  const handleGoogle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await authService.signInWithGoogle();
      if (res.success) {
        router.replace("/(tabs)");
      } else {
        showToast.error(res.error || "Не удалось войти через Google");
      }
    } catch (err: any) {
      showToast.error(err?.message || "Не удалось войти через Google");
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await authService.signInWithApple();
      if (res.success) {
        router.replace("/(tabs)");
      } else {
        showToast.error(res.error || "Не удалось войти через Apple");
      }
    } catch (err: any) {
      showToast.error(err?.message || "Не удалось войти через Apple");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Image
            source={isDark ? require("../../assets/images/bright_logo.png") : require("../../assets/images/dark_logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        
        <View style={styles.header}>
          <Text style={styles.title}>Вход</Text>
          <Text style={styles.subtitle}>Выберите способ авторизации</Text>
        </View>

        <View style={styles.buttons}>
          <AuthButton provider="apple" onPress={handleApple} disabled={loading} />
          <View style={styles.spacing} />
          <AuthButton provider="google" onPress={handleGoogle} disabled={loading} />
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
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 200,
    height: 200,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
  },
  buttons: {
    gap: 16,
  },
  spacing: {
    height: 12,
  },
  footer: {
    marginTop: 32,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
  },
});
