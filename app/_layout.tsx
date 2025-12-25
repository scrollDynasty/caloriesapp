import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { SnowOverlay } from "../components/ui/SnowOverlay";
import { OnboardingProvider } from "../context/OnboardingContext";
import { SnowProvider } from "../context/SnowContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import "../global.css";
import { onAuthExpired } from "../services/api";

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthExpired(() => {
      if (__DEV__) console.log("Auth expired, redirecting to login...");
      const isOnLogin = segments[0] === "auth";
      if (!isOnLogin) {
        router.replace("/auth/login");
      }
    });

    return () => unsubscribe();
  }, [router, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 250,
        gestureEnabled: true,
        gestureDirection: "horizontal",
        fullScreenGestureEnabled: true,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          gestureEnabled: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="personal-data"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="app-settings"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="save-progress"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="scan-meal"
        options={{
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="meal-result"
        options={{
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="meal-detail"
        options={{
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="auth/login"
        options={{
          gestureEnabled: false,
          animation: "fade",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SnowProvider>
        <OnboardingProvider>
          <View style={{ flex: 1 }}>
            <RootNavigator />
            <SnowOverlay />
          </View>
        </OnboardingProvider>
      </SnowProvider>
    </ThemeProvider>
  );
}
