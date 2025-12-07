import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FoodImagePreview from "../components/features/FoodImagePreview";
import TextContent from "../components/features/TextContent";
import { PrimaryButton, SecondaryButton } from "../components/ui/Button";
import { colors } from "../constants/theme";
import { useFonts } from "../hooks/use-fonts";
import { getImageHeight, getImageWidth } from "../utils/responsive";

// Предзагрузка всех шагов для устранения задержек при переходе
// Импортируем компоненты, чтобы они были загружены в память
import Step1 from "./steps/step1";
import Step2 from "./steps/step2";
import Step3 from "./steps/step3";
import Step4 from "./steps/step4";
import Step5 from "./steps/step5";
import Step6 from "./steps/step6";
import Step7 from "./steps/step7";
import Step8 from "./steps/step8";
import Step9 from "./steps/step9";

/**
 * Экран первого шага - Умный подсчет калорий
 */
export default function Index() {
  const fontsLoaded = useFonts();
  const router = useRouter();

  // Полная предзагрузка всех шагов при монтировании компонента
  // Скрытые компоненты внизу будут полностью инициализированы, но не видны пользователю
  // Это гарантирует их полную инициализацию до первого перехода

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

      {/* Скрытые экземпляры всех шагов для полной предзагрузки */}
      {/* Они рендерятся, но не видны пользователю, что гарантирует их полную инициализацию */}
      <View style={styles.preloadContainer} pointerEvents="none">
        <Step1 />
        <Step2 />
        <Step3 />
        <Step4 />
        <Step5 />
        <Step6 />
        <Step7 />
        <Step8 />
        <Step9 />
      </View>
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
  preloadContainer: {
    position: "absolute",
    top: -9999,
    left: -9999,
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
    pointerEvents: "none",
  },
});
