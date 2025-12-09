import { Stack } from "expo-router";
import { OnboardingProvider } from "../context/OnboardingContext";
import "../global.css";

export default function RootLayout() {
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
            gestureEnabled: false, // Отключаем жест назад на главном экране
          }}
        />
        <Stack.Screen
          name="save-progress"
          options={{
            gestureEnabled: false, // Отключаем жест назад на экране авторизации
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
