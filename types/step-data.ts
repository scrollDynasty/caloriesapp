/**
 * Типы для сохранения данных шагов пользователя в БД
 * Всего будет 9 шагов, каждый шаг сохраняет ответы пользователя
 */

export interface StepData {
  stepNumber: number; // 1-9
  userId?: string; // ID пользователя (если авторизован)
  answers: Record<string, any>; // Ответы пользователя на этом шаге
  timestamp: Date; // Время прохождения шага
  completed: boolean; // Завершен ли шаг
}

export interface Step1Data extends StepData {
  stepNumber: 1;
  answers: {
    // Данные первого шага (экран с камерой)
    started?: boolean; // Нажал ли "Начать"
    hasAccount?: boolean; // Нажал ли "Уже есть аккаунт?"
    // Дополнительные данные будут добавлены по мере разработки
  };
}

// Общий тип для всех шагов
export type AllStepsData = Step1Data; // Будет расширен для шагов 2-9

