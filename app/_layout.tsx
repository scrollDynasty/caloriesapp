import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { OnboardingProvider } from "../context/OnboardingContext";
import "../global.css";
import { onAuthExpired } from "../services/api";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Подписываемся на событие истечения авторизации
    const unsubscribe = onAuthExpired(() => {
      console.log("Auth expired, redirecting to login...");
      // Проверяем, что мы не уже на странице логина
      const isOnLogin = segments[0] === "auth";
      if (!isOnLogin) {
        router.replace("/auth/login");
      }
    });

    return () => unsubscribe();
  }, [router, segments]);

  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 400,
          gestureEnabled: true,
          gestureDirection: "horizontal",
          fullScreenGestureEnabled: true,
          contentStyle: {
            backgroundColor: "#F9F7F5",
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            gestureEnabled: false, 
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
    </OnboardingProvider>
  );
}
