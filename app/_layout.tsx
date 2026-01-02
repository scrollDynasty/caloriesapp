import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { AnimatedSplash } from "../components/ui/AnimatedSplash";
import { BadgeCelebration } from "../components/ui/BadgeCelebration";
import { SnowOverlay } from "../components/ui/SnowOverlay";
import { AppSettingsProvider, useAppSettings } from "../context/AppSettingsContext";
import { OnboardingProvider } from "../context/OnboardingContext";
import { ProcessingMealsProvider } from "../context/ProcessingMealsContext";
import { SnowProvider } from "../context/SnowContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import "../global.css";
import { apiService, onAuthExpired } from "../services/api";

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthExpired(() => {
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
        name="meal-detail"
        options={{
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="badges"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="subscription"
        options={{
          animation: "slide_from_bottom",
          presentation: "modal",
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

function BadgeCelebrationWrapper() {
  const { shouldShowBadgeCelebration, pendingBadgeCelebration, markBadgeCelebrationShown } = useAppSettings();
  const [currentBadgeId, setCurrentBadgeId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (pendingBadgeCelebration && pendingBadgeCelebration !== currentBadgeId) {
      setCurrentBadgeId(pendingBadgeCelebration);
    }
  }, [pendingBadgeCelebration, currentBadgeId]);
  
  const handleClose = React.useCallback(async () => {
    if (currentBadgeId) {
      try {
        await apiService.markBadgesSeen([currentBadgeId]);
      } catch {
      }
    }
    markBadgeCelebrationShown();
    setCurrentBadgeId(null);
  }, [currentBadgeId, markBadgeCelebrationShown]);
  
  return (
    <BadgeCelebration
      visible={shouldShowBadgeCelebration()}
      badgeType={pendingBadgeCelebration || "goal_reached"}
      onClose={handleClose}
    />
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <ThemeProvider>
      <AppSettingsProvider>
        <ProcessingMealsProvider>
          <SnowProvider>
            <OnboardingProvider>
              <View style={{ flex: 1 }}>
                <RootNavigator />
                <SnowOverlay />
                <BadgeCelebrationWrapper />
                {showSplash && <AnimatedSplash onFinish={() => setShowSplash(false)} />}
              </View>
            </OnboardingProvider>
          </SnowProvider>
        </ProcessingMealsProvider>
      </AppSettingsProvider>
    </ThemeProvider>
  );
}
