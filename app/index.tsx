import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FoodImagePreview from "../components/features/FoodImagePreview";
import TextContent from "../components/features/TextContent";
import { PrimaryButton, SecondaryButton } from "../components/ui/Button";
import { useTheme } from "../context/ThemeContext";
import { useFonts } from "../hooks/use-fonts";
import { authService } from "../services/auth";
import { getImageHeight, getImageWidth } from "../utils/responsive";

import Step1 from "./steps/step1";
import Step2 from "./steps/step2";
import Step3 from "./steps/step3";
import Step4 from "./steps/step4";
import Step5 from "./steps/step5";
import Step6 from "./steps/step6";
import Step7 from "./steps/step7";
import Step8 from "./steps/step8";
import Step9 from "./steps/step9";

export default function Index() {
  const { colors } = useTheme();
  const fontsLoaded = useFonts();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        
        router.replace("/(tabs)");
        return;
      }
    } catch {

    } finally {
      setCheckingAuth(false);
    }
  };

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
    imageWrapper: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      width: "100%",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    textContainer: {
      paddingHorizontal: 24,
      paddingBottom: 24,
      gap: 16, 
    },
    preloadContainer: {
      position: "absolute",
      top: -9999,
      left: -9999,
      width: 1,
      height: 1,
      opacity: 0,
      overflow: "hidden",
      pointerEvents: "none",
    },
  });

  if (!fontsLoaded || checkingAuth) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const imageWidth = getImageWidth();
  const imageHeight = getImageHeight(imageWidth);

  const handleStartPress = () => {
    router.push("/steps/step1");
  };

  const handleLoginPress = () => {
    router.push("/auth/login" as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {}
        <View style={styles.imageWrapper}>
          <FoodImagePreview
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          />
        </View>

        {}
        <View style={styles.textContainer}>
          <TextContent
            title="Умный подсчет калорий"
            subtitle="Наведите камеру на еду, чтобы узнать ее калорийность"
          />

          {}
          <PrimaryButton label="Начать" onPress={handleStartPress} />

          {}
          <SecondaryButton
            label="Уже есть аккаунт? Войти"
            onPress={handleLoginPress}
          />
        </View>
      </ScrollView>

      {}
      {}
      <View style={styles.preloadContainer} pointerEvents="none">
        <Step1 />
        <Step2 />
        <Step3 />
        <Step4 />
        <Step5 />
        <Step6 />
        <Step7 />
        <Step8 />
        <Step9 />
      </View>
    </SafeAreaView>
  );
}
