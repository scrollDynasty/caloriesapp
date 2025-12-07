import { Stack } from "expo-router";
import "../global.css";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Плавная fade анимация для красивого перехода
        animation: "fade",
        animationDuration: 400,
        gestureEnabled: true,
        gestureDirection: "horizontal",
        fullScreenGestureEnabled: true,
        contentStyle: {
          backgroundColor: "#F9F7F5",
        },
      }}
    />
  );
}
