import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FoodImagePreview from "../components/features/FoodImagePreview";
import TextContent from "../components/features/TextContent";
import { PrimaryButton, SecondaryButton } from "../components/ui/Button";
import { colors } from "../constants/theme";
import { useFonts } from "../hooks/use-fonts";
import { getImageHeight, getImageWidth } from "../utils/responsive";

/**
 * Экран первого шага - Умный подсчет калорий
 */
export default function Index() {
  const fontsLoaded = useFonts();
  const router = useRouter();

  if (!fontsLoaded) {
    return null;
  }

  // Адаптивные размеры изображения
  const imageWidth = getImageWidth();
  const imageHeight = getImageHeight(imageWidth);

  const handleStartPress = () => {
    router.push({
      pathname: "/steps/step1",
    } as any);
  };

  const handleLoginPress = () => {
    // TODO: Переход на экран входа
    console.log("Войти");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Контейнер с изображением еды */}
        <View style={styles.imageWrapper}>
          <FoodImagePreview
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          />
        </View>

        {/* Текстовый контент */}
        <View style={styles.textContainer}>
          <TextContent
            title="Умный подсчет калорий"
            subtitle="Наведите камеру на еду, чтобы узнать ее калорийность"
          />

          {/* Кнопка "Начать" */}
          <PrimaryButton label="Начать" onPress={handleStartPress} />

          {/* Кнопка "Уже есть аккаунт? Войти" */}
          <SecondaryButton
            label="Уже есть аккаунт? Войти"
            onPress={handleLoginPress}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  imageWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    width: "100%",
  },
  textContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16, // gap: 16px из Figma
  },
});
