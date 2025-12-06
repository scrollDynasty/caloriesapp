import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    useFonts as useExpoFonts,
} from "@expo-google-fonts/inter";

/**
 * Хук для загрузки шрифтов Inter
 * @returns true если шрифты загружены, false в противном случае
 */
export const useFonts = () => {
  const [fontsLoaded] = useExpoFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return fontsLoaded;
};

