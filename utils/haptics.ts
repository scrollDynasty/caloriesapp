import * as Haptics from "expo-haptics";

/**
 * Утилита для вибрации при действиях пользователя
 * Использует разные типы вибрации для разных действий
 */

/**
 * Легкая вибрация - для легких действий (переключение табов, выбор категории, переключение переключателей)
 */
export function hapticLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Средняя вибрация - для основных действий (нажатие кнопок, переходы, выбор элементов)
 */
export function hapticMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Сильная вибрация - для важных действий (сохранение, подтверждение, удаление)
 */
export function hapticHeavy() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Вибрация успеха - для успешных операций
 */
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Вибрация ошибки - для ошибок
 */
export function hapticError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/**
 * Вибрация предупреждения - для предупреждений
 */
export function hapticWarning() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/**
 * Вибрация выбора - для выбора элемента (iOS style)
 */
export function hapticSelection() {
  Haptics.selectionAsync();
}

