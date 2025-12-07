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
      </Stack>
    </OnboardingProvider>
  );
}
