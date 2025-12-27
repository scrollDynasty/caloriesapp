import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { StatusBar } from "react-native";

export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  card: string;
  cardSecondary: string;
  cardElevated: string;
  
  text: string;
  textSecondary: string;
  textTertiary: string;
  textQuaternary: string;
  
  primary: string;
  accent: string;
  accentSecondary: string;
  
  white: string;
  black: string;
  
  border: string;
  separator: string;
  separatorOpaque: string;
  
  fill: string;
  fillSecondary: string;
  fillTertiary: string;
  fillQuaternary: string;
  
  gray: string;
  gray2: string;
  gray3: string;
  gray4: string;
  gray5: string;
  gray6: string;
  
  success: string;
  warning: string;
  error: string;
  info: string;
  
  inputBackground: string;
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
  
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
  
  switchTrackOff: "#E8E4DC",
  switchTrackOn: "#2D2A26",
  
  groupedBackground: "#F9F7F5",
  label: "#2D2A26",
  secondaryLabel: "rgba(44, 42, 38, 0.6)",
  tertiaryLabel: "rgba(44, 42, 38, 0.4)",
  quaternaryLabel: "rgba(44, 42, 38, 0.2)",
  placeholderText: "rgba(44, 42, 38, 0.3)",
  
  secondary: "#8C867D",
};

const darkColors: ThemeColors = {
  background: "#000000",
  backgroundSecondary: "#1C1C1E",
  backgroundTertiary: "#2C2C2E",
  
  card: "#1C1C1E",
  cardSecondary: "#2C2C2E",
  cardElevated: "#3A3A3C",
  
  text: "#FFFFFF",
  textSecondary: "rgba(235, 235, 245, 0.6)",
  textTertiary: "rgba(235, 235, 245, 0.38)",
  textQuaternary: "rgba(235, 235, 245, 0.18)",
  
  primary: "#FFFFFF",
  accent: "#FF6B6B",
  accentSecondary: "#FF8585",
  
  white: "#FFFFFF",
  black: "#000000",
  
  border: "#38383A",
  separator: "rgba(84, 84, 88, 0.65)",
  separatorOpaque: "#38383A",
  
  fill: "rgba(120, 120, 128, 0.36)",
  fillSecondary: "rgba(120, 120, 128, 0.32)",
  fillTertiary: "rgba(118, 118, 128, 0.24)",
  fillQuaternary: "rgba(116, 116, 128, 0.18)",
  
  gray: "#8E8E93",
  gray2: "#636366",
  gray3: "#48484A",
  gray4: "#3A3A3C",
  gray5: "#2C2C2E",
  gray6: "#1C1C1E",
  
  success: "#30D158",
  warning: "#FF9F0A",
  error: "#FF453A",
  info: "#0A84FF",
  
  inputBackground: "#1C1C1E",
  buttonPrimary: "#FFFFFF",
  buttonPrimaryText: "#000000",
  buttonSecondary: "#2C2C2E",
  buttonSecondaryText: "#FFFFFF",
  
  switchTrackOff: "#38383A",
  switchTrackOn: "#FFFFFF",
  
  groupedBackground: "#000000",
  label: "#FFFFFF",
  secondaryLabel: "rgba(235, 235, 245, 0.6)",
  tertiaryLabel: "rgba(235, 235, 245, 0.38)",
  quaternaryLabel: "rgba(235, 235, 245, 0.18)",
  placeholderText: "rgba(235, 235, 245, 0.3)",
  
  secondary: "#8E8E93",
};

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "@yebich:theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

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

export const defaultColors = lightColors;
export const darkThemeColors = darkColors;
