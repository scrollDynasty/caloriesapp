import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { StatusBar } from "react-native";

export type ThemeMode = "light" | "dark";

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
  // iOS specific
  groupedBackground: string;
  separator: string;
  fill: string;
  secondaryFill: string;
  tertiaryFill: string;
  label: string;
  secondaryLabel: string;
  tertiaryLabel: string;
}

// iOS Human Interface Guidelines - Light Mode
const lightColors: ThemeColors = {
  background: "#F2F2F7",
  card: "#FFFFFF",
  cardSecondary: "#F2F2F7",
  primary: "#000000",
  secondary: "#8E8E93",
  text: "#000000",
  textSecondary: "#8E8E93",
  border: "#C6C6C8",
  white: "#FFFFFF",
  accent: "#FF6B6B",
  // iOS specific
  groupedBackground: "#F2F2F7",
  separator: "#C6C6C8",
  fill: "#787880",
  secondaryFill: "#787880",
  tertiaryFill: "#767680",
  label: "#000000",
  secondaryLabel: "#3C3C43",
  tertiaryLabel: "#3C3C43",
};

// iOS Human Interface Guidelines - Dark Mode
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
  // iOS specific
  groupedBackground: "#000000",
  separator: "#38383A",
  fill: "#787880",
  secondaryFill: "#636366",
  tertiaryFill: "#48484A",
  label: "#FFFFFF",
  secondaryLabel: "#EBEBF5",
  tertiaryLabel: "#EBEBF5",
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
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  // Update StatusBar when theme changes
  useEffect(() => {
    if (isLoaded) {
      StatusBar.setBarStyle(themeMode === "dark" ? "light-content" : "dark-content", true);
    }
  }, [themeMode, isLoaded]);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") {
        setThemeModeState(saved);
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

  const isDark = themeMode === "dark";
  const colors = isDark ? darkColors : lightColors;

  if (!isLoaded) {
    return null;
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

// Export default colors for non-context usage (legacy support)
export const defaultColors = lightColors;
