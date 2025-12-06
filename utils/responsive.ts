import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Базовая ширина из дизайна Figma
 */
const BASE_WIDTH = 390;

/**
 * Вычисляет адаптивный размер на основе базового размера из Figma
 */
export const getResponsiveSize = (baseSize: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * baseSize;
};

/**
 * Вычисляет адаптивную ширину изображения
 * Из Figma: ширина изображения 374px при ширине контейнера 390px
 */
export const getImageWidth = (): number => {
  // Вычисляем пропорционально ширине экрана
  // Базовая ширина контейнера из Figma: 390px
  // Ширина изображения из Figma: 374px
  const calculatedWidth = (SCREEN_WIDTH / 390) * 374;
  // Ограничиваем максимальной шириной из дизайна (374px)
  // И минимальной шириной с учетом отступов (SCREEN_WIDTH - 32px)
  const maxWidth = 374;
  const minWidth = Math.max(320, SCREEN_WIDTH - 32);
  return Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
};

/**
 * Вычисляет адаптивную высоту изображения на основе ширины
 */
export const getImageHeight = (width: number): number => {
  return (width / 374) * 559;
};

