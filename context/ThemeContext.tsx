import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { StatusBar } from "react-native";

export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  // Core backgrounds
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  // Cards & Surfaces
  card: string;
  cardSecondary: string;
  cardElevated: string;
  
  // Text colors (following iOS HIG)
  text: string;
  textSecondary: string;
  textTertiary: string;
  textQuaternary: string;
  
  // Primary & Accent
  primary: string;
  accent: string;
  accentSecondary: string;
  
  // System colors
  white: string;
  black: string;
  
  // Borders & Separators
  border: string;
  separator: string;
  separatorOpaque: string;
  
  // Fill colors (for controls)
  fill: string;
  fillSecondary: string;
  fillTertiary: string;
  fillQuaternary: string;
  
  // System grays
  gray: string;
  gray2: string;
  gray3: string;
  gray4: string;
  gray5: string;
  gray6: string;
  
  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Component specific
  inputBackground: string;
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
  
  // Toggle/Switch
  switchTrackOff: string;
  switchTrackOn: string;
  
  groupedBackground: string;
  label: string;
  secondaryLabel: string;
  tertiaryLabel: string;
  quaternaryLabel: string;
  placeholderText: string;
  
  secondary: string;
}

const lightColors: ThemeColors = {
  background: "#F9F7F5",
  backgroundSecondary: "#F5F3F0",
  backgroundTertiary: "#FFFFFF",
  
  card: "#FFFFFF",
  cardSecondary: "#F9F7F5",
  cardElevated: "#FFFFFF",
  
  text: "#2D2A26",
  textSecondary: "#8C867D",
  textTertiary: "#8C867D",
  textQuaternary: "#8C867D",
  
  primary: "#2D2A26",
  accent: "#FF6B6B",
  accentSecondary: "#FF8585",
  
  white: "#FFFFFF",
  black: "#000000",
  
  border: "#E8E4DC",
  separator: "rgba(44, 42, 38, 0.2)",
  separatorOpaque: "#E8E4DC",
  
  fill: "rgba(44, 42, 38, 0.1)",
  fillSecondary: "rgba(44, 42, 38, 0.08)",
  fillTertiary: "rgba(44, 42, 38, 0.06)",
  fillQuaternary: "rgba(44, 42, 38, 0.04)",
  
  gray: "#8C867D",
  gray2: "#A8A29A",
  gray3: "#C5C0B8",
  gray4: "#DAD4CA",
  gray5: "#E8E4DC",
  gray6: "#F5F3F0",
  
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
  info: "#007AFF",
  
  inputBackground: "#F9F7F5",
  buttonPrimary: "#2D2A26",
  buttonPrimaryText: "#FFFFFF",
  buttonSecondary: "#F5F3F0",
  buttonSecondaryText: "#2D2A26",
  
  // Toggle/Switch
  switchTrackOff: "#E8E4DC",
  switchTrackOn: "#2D2A26",
  
  // iOS specific
  groupedBackground: "#F9F7F5",
  label: "#2D2A26",
  secondaryLabel: "rgba(44, 42, 38, 0.6)",
  tertiaryLabel: "rgba(44, 42, 38, 0.4)",
  quaternaryLabel: "rgba(44, 42, 38, 0.2)",
  placeholderText: "rgba(44, 42, 38, 0.3)",
  
  // Legacy
  secondary: "#8C867D",
};

// iOS 17 Human Interface Guidelines - Dark Mode
// True dark with elevated surfaces for depth
const darkColors: ThemeColors = {
  // Core backgrounds - True black with elevated grays
  background: "#000000",
  backgroundSecondary: "#1C1C1E",
  backgroundTertiary: "#2C2C2E",
  
  // Cards & Surfaces - Elevated for depth perception
  card: "#1C1C1E",
  cardSecondary: "#2C2C2E",
  cardElevated: "#3A3A3C",
  
  // Text colors - High contrast whites
  text: "#FFFFFF",
  textSecondary: "rgba(235, 235, 245, 0.6)",
  textTertiary: "rgba(235, 235, 245, 0.38)",
  textQuaternary: "rgba(235, 235, 245, 0.18)",
  
  // Primary & Accent
  primary: "#FFFFFF",
  accent: "#FF6B6B",
  accentSecondary: "#FF8585",
  
  // System colors
  white: "#FFFFFF",
  black: "#000000",
  
  // Borders & Separators
  border: "#38383A",
  separator: "rgba(84, 84, 88, 0.65)",
  separatorOpaque: "#38383A",
  
  // Fill colors - Lighter for visibility on dark
  fill: "rgba(120, 120, 128, 0.36)",
  fillSecondary: "rgba(120, 120, 128, 0.32)",
  fillTertiary: "rgba(118, 118, 128, 0.24)",
  fillQuaternary: "rgba(116, 116, 128, 0.18)",
  
  // System grays (iOS Dark)
  gray: "#8E8E93",
  gray2: "#636366",
  gray3: "#48484A",
  gray4: "#3A3A3C",
  gray5: "#2C2C2E",
  gray6: "#1C1C1E",
  
  // Semantic colors - Adjusted for dark backgrounds
  success: "#30D158",
  warning: "#FF9F0A",
  error: "#FF453A",
  info: "#0A84FF",
  
  // Component specific
  inputBackground: "#1C1C1E",
  buttonPrimary: "#FFFFFF",
  buttonPrimaryText: "#000000",
  buttonSecondary: "#2C2C2E",
  buttonSecondaryText: "#FFFFFF",
  
  // Toggle/Switch
  switchTrackOff: "#38383A",
  switchTrackOn: "#FFFFFF",
  
  // iOS specific
  groupedBackground: "#000000",
  label: "#FFFFFF",
  secondaryLabel: "rgba(235, 235, 245, 0.6)",
  tertiaryLabel: "rgba(235, 235, 245, 0.38)",
  quaternaryLabel: "rgba(235, 235, 245, 0.18)",
  placeholderText: "rgba(235, 235, 245, 0.3)",
  
  // Legacy
  secondary: "#8E8E93",
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
      if (__DEV__) console.error("Error loading theme:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      if (__DEV__) console.error("Error saving theme:", error);
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

// Export colors for legacy/non-context usage
export const defaultColors = lightColors;
export const darkThemeColors = darkColors;
