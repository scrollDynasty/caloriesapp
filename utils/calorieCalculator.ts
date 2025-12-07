/**
 * Утилита для расчета калорий и макронутриентов
 * Использует формулу Миффлина-Сан Жеора (Mifflin-St Jeor Equation)
 * - самая точная формула для расчета базового метаболизма (BMR) для общего населения
 * - Точность: ±10% для 82% не-ожиревших и 70% ожиревших людей
 * - Альтернатива Katch-McArdle требует данные о проценте жира, которых у нас нет
 */

export interface UserData {
  gender: "male" | "female";
  age: number; // в годах
  height: number; // в см
  weight: number; // в кг
  workoutFrequency: "0-2" | "3-5" | "6+"; // количество тренировок в неделю
  goal: "lose" | "maintain" | "gain"; // цель: похудеть, поддерживать, набрать
}

export interface CalorieResult {
  bmr: number; // Базовый метаболизм (Basal Metabolic Rate)
  tdee: number; // Общий расход энергии (Total Daily Energy Expenditure)
  targetCalories: number; // Целевые калории с учетом цели
  macros: {
    protein: {
      grams: number;
      calories: number;
      percentage: number;
    };
    carbs: {
      grams: number;
      calories: number;
      percentage: number;
    };
    fats: {
      grams: number;
      calories: number;
      percentage: number;
    };
  };
}

/**
 * Рассчитывает базовый метаболизм (BMR) по формуле Миффлина-Сан Жеора
 */
function calculateBMR(data: UserData): number {
  const { gender, age, height, weight } = data;

  // Формула Миффлина-Сан Жеора
  // Мужчины: BMR = (10 × вес в кг) + (6.25 × рост в см) − (5 × возраст) + 5
  // Женщины: BMR = (10 × вес в кг) + (6.25 × рост в см) − (5 × возраст) − 161

  const baseBMR = 10 * weight + 6.25 * height - 5 * age;
  const genderFactor = gender === "male" ? 5 : -161;

  return Math.round(baseBMR + genderFactor);
}

/**
 * Рассчитывает коэффициент активности на основе частоты тренировок
 * Использует стандартные коэффициенты активности для TDEE
 */
function getActivityFactor(workoutFrequency: UserData["workoutFrequency"]): number {
  switch (workoutFrequency) {
    case "0-2":
      return 1.2; // Сидячий образ жизни (мало или нет упражнений)
    case "3-5":
      return 1.55; // Умеренная активность (умеренные упражнения 3-5 дней/неделю)
    case "6+":
      return 1.725; // Высокая активность (тяжелые упражнения 6-7 дней/неделю)
    default:
      return 1.2;
  }
}

/**
 * Рассчитывает целевые калории с учетом цели пользователя
 * Использует безопасные дефициты/профициты для здорового изменения веса
 */
function calculateTargetCalories(
  tdee: number,
  goal: UserData["goal"],
  gender: UserData["gender"]
): number {
  switch (goal) {
    case "lose":
      // Дефицит 500 ккал для похудения (примерно 0.5 кг в неделю)
      // Минимум 1200 ккал для женщин, 1500 для мужчин для безопасности
      const deficit = 500;
      const minCalories = gender === "male" ? 1500 : 1200; // Минимальные безопасные калории
      return Math.max(Math.round(tdee - deficit), minCalories);
    case "gain":
      // Профицит 300-500 ккал для набора веса (здоровый набор)
      return Math.round(tdee + 400);
    case "maintain":
    default:
      // Поддержание веса
      return Math.round(tdee);
  }
}

/**
 * Рассчитывает распределение макронутриентов
 * Адаптируется под цель пользователя согласно современным рекомендациям
 */
function calculateMacros(
  targetCalories: number,
  weight: number,
  goal: UserData["goal"]
): CalorieResult["macros"] {
  // Белки: основаны на научных рекомендациях для разных целей
  // Для похудения: больше белка для сохранения мышечной массы
  // Для набора: достаточно для роста мышц
  let proteinGrams: number;
  if (goal === "lose") {
    proteinGrams = weight * 2.2; // 2.2-2.4 г/кг для похудения (сохранение мышц)
  } else if (goal === "gain") {
    proteinGrams = weight * 2.0; // 1.8-2.2 г/кг для набора мышечной массы
  } else {
    proteinGrams = weight * 2.0; // 2.0 г/кг для поддержания
  }

  const proteinCalories = proteinGrams * 4; // 1 г белка = 4 ккал
  const proteinPercentage = (proteinCalories / targetCalories) * 100;

  // Жиры: минимум 0.8-1 г/кг или 20-30% от калорий (критично для гормонов)
  // При похудении можно немного снизить, но не ниже 20%
  const fatGramsPerKg = goal === "lose" ? 0.9 : 1.0;
  const fatGrams = weight * fatGramsPerKg;
  const fatCalories = fatGrams * 9; // 1 г жира = 9 ккал
  const fatPercentage = (fatCalories / targetCalories) * 100;

  // Углеводы: остаток калорий (основной источник энергии)
  const carbsCalories = targetCalories - proteinCalories - fatCalories;
  const carbsGrams = carbsCalories / 4; // 1 г углеводов = 4 ккал
  const carbsPercentage = (carbsCalories / targetCalories) * 100;

  return {
    protein: {
      grams: Math.round(proteinGrams),
      calories: Math.round(proteinCalories),
      percentage: Math.round(proteinPercentage * 10) / 10,
    },
    carbs: {
      grams: Math.round(carbsGrams),
      calories: Math.round(carbsCalories),
      percentage: Math.round(carbsPercentage * 10) / 10,
    },
    fats: {
      grams: Math.round(fatGrams),
      calories: Math.round(fatCalories),
      percentage: Math.round(fatPercentage * 10) / 10,
    },
  };
}

/**
 * Главная функция для расчета всех показателей
 */
export function calculateCalories(data: UserData): CalorieResult {
  // 1. Рассчитываем базовый метаболизм (BMR)
  const bmr = calculateBMR(data);

  // 2. Рассчитываем общий расход энергии (TDEE)
  const activityFactor = getActivityFactor(data.workoutFrequency);
  const tdee = Math.round(bmr * activityFactor);

  // 3. Рассчитываем целевые калории с учетом цели
  const targetCalories = calculateTargetCalories(tdee, data.goal, data.gender);

  // 4. Рассчитываем макронутриенты
  const macros = calculateMacros(targetCalories, data.weight, data.goal);

  return {
    bmr,
    tdee,
    targetCalories,
    macros,
  };
}
