import { Dimensions, Platform } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BASE_WIDTH = 390;

export const getResponsiveSize = (baseSize: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * baseSize;
};

export const getImageWidth = (): number => {
  const calculatedWidth = (SCREEN_WIDTH / 390) * 374;
  
  if (Platform.OS === "android") {
    const maxWidth = 320;
    const minWidth = Math.max(280, SCREEN_WIDTH - 48);
    return Math.max(minWidth, Math.min(maxWidth, calculatedWidth * 0.85));
  }

  const maxWidth = 374;
  const minWidth = Math.max(320, SCREEN_WIDTH - 32);
  return Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
};

export const getImageHeight = (width: number): number => {
  if (Platform.OS === "android") {
    return (width / 374) * 520;
  }
  return (width / 374) * 600;
};

