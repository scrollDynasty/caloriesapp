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
  
  // iOS specific
  groupedBackground: string;
  label: string;
  secondaryLabel: string;
  tertiaryLabel: string;
  quaternaryLabel: string;
  placeholderText: string;
  
  // Legacy compatibility
  secondary: string;
}

// iOS 17 Human Interface Guidelines - Light Mode
// Reference: https://developer.apple.com/design/human-interface-guidelines/color
const lightColors: ThemeColors = {
  // Core backgrounds - Clean whites and light grays
  background: "#FFFFFF",
  backgroundSecondary: "#F2F2F7",
  backgroundTertiary: "#FFFFFF",
  
  // Cards & Surfaces
  card: "#FFFFFF",
  cardSecondary: "#F2F2F7",
  cardElevated: "#FFFFFF",
  
  // Text colors - Strong contrast for readability
  text: "#000000",
  textSecondary: "#3C3C43",
  textTertiary: "#3C3C43",
  textQuaternary: "#3C3C43",
  
  // Primary & Accent - App brand colors
  primary: "#1C1C1E",
  accent: "#FF6B6B",
  accentSecondary: "#FF8585",
  
  // System colors
  white: "#FFFFFF",
  black: "#000000",
  
  // Borders & Separators
  border: "#C6C6C8",
  separator: "rgba(60, 60, 67, 0.29)",
  separatorOpaque: "#C6C6C8",
  
  // Fill colors
  fill: "rgba(120, 120, 128, 0.2)",
  fillSecondary: "rgba(120, 120, 128, 0.16)",
  fillTertiary: "rgba(118, 118, 128, 0.12)",
  fillQuaternary: "rgba(116, 116, 128, 0.08)",
  
  // System grays (iOS)
  gray: "#8E8E93",
  gray2: "#AEAEB2",
  gray3: "#C7C7CC",
  gray4: "#D1D1D6",
  gray5: "#E5E5EA",
  gray6: "#F2F2F7",
  
  // Semantic colors
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
  info: "#007AFF",
  
  // Component specific
  inputBackground: "#F2F2F7",
  buttonPrimary: "#1C1C1E",
  buttonPrimaryText: "#FFFFFF",
  buttonSecondary: "#F2F2F7",
  buttonSecondaryText: "#1C1C1E",
  
  // Toggle/Switch
  switchTrackOff: "#E5E5EA",
  switchTrackOn: "#1C1C1E",
  
  // iOS specific
  groupedBackground: "#F2F2F7",
  label: "#000000",
  secondaryLabel: "rgba(60, 60, 67, 0.6)",
  tertiaryLabel: "rgba(60, 60, 67, 0.33)",
  quaternaryLabel: "rgba(60, 60, 67, 0.18)",
  placeholderText: "rgba(60, 60, 67, 0.3)",
  
  // Legacy
  secondary: "#8E8E93",
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

// Export colors for legacy/non-context usage
export const defaultColors = lightColors;
export const darkThemeColors = darkColors;
