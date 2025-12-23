import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ColorSchemeName, useColorScheme } from "react-native";

export type ThemeMode = "system" | "light" | "dark";

export interface ThemeColors {
  background: string;
  card: string;
  cardSecondary: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  white: string;
  accent: string;
}

const lightColors: ThemeColors = {
  background: "#F9F7F5",
  card: "#FFFFFF",
  cardSecondary: "#F5F5F5",
  primary: "#2D2A26",
  secondary: "#8C867D",
  text: "#2D2A26",
  textSecondary: "#8C867D",
  border: "#E5E5E5",
  white: "#FFFFFF",
  accent: "#FF6B6B",
};

const darkColors: ThemeColors = {
  background: "#000000",
  card: "#1C1C1E",
  cardSecondary: "#2C2C2E",
  primary: "#FFFFFF",
  secondary: "#8E8E93",
  text: "#FFFFFF",
  textSecondary: "#8E8E93",
  border: "#38383A",
  white: "#1C1C1E",
  accent: "#FF6B6B",
};

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "@caloriesapp:theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved && (saved === "system" || saved === "light" || saved === "dark")) {
        setThemeModeState(saved as ThemeMode);
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  // Determine actual color scheme
  const getEffectiveColorScheme = (): ColorSchemeName => {
    if (themeMode === "system") {
      return systemColorScheme || "light";
    }
    return themeMode;
  };

  const effectiveScheme = getEffectiveColorScheme();
  const isDark = effectiveScheme === "dark";
  const colors = isDark ? darkColors : lightColors;

  if (!isLoaded) {
    return null; // Or a loading screen
  }

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Export default colors for non-context usage
export const colors = lightColors;

