
import { calculateCalories, UserData } from "../utils/calorieCalculator";
import { apiService } from "./api";

export interface OnboardingData {
  
  gender?: "male" | "female";

  workoutFrequency?: "0-2" | "3-5" | "6+";

  height?: number;
  weight?: number;

  birthDate?: Date;

  hasTrainer?: boolean;

  goal?: "lose" | "maintain" | "gain";

  barrier?: string;

  dietType?: "classic" | "pescatarian" | "vegetarian" | "vegan";

  motivation?: string;
}

export async function saveOnboardingData(data: OnboardingData) {
  try {
    
    if (
      !data.gender ||
      !data.height ||
      !data.weight ||
      !data.workoutFrequency ||
      !data.goal
    ) {
      throw new Error("Недостаточно данных для расчета");
    }

    let age = 25; 
    if (data.birthDate) {
      const today = new Date();
      const birth = new Date(data.birthDate);
      age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
    }

    const userData: UserData = {
      gender: data.gender,
      age,
      height: data.height,
      weight: data.weight,
      workoutFrequency: data.workoutFrequency,
      goal: data.goal,
    };

    const calculations = calculateCalories(userData);

    const payload = {
      gender: data.gender,
      workout_frequency: data.workoutFrequency,
      height: data.height,
      weight: data.weight,
      birth_date: data.birthDate?.toISOString().split("T")[0],
      has_trainer: data.hasTrainer,
      goal: data.goal,
      barrier: data.barrier,
      diet_type: data.dietType,
      motivation: data.motivation,
      
      bmr: calculations.bmr,
      tdee: calculations.tdee,
      target_calories: calculations.targetCalories,
      
      protein_grams: calculations.macros.protein.grams,
      protein_calories: calculations.macros.protein.calories,
      protein_percentage: calculations.macros.protein.percentage,
      carbs_grams: calculations.macros.carbs.grams,
      carbs_calories: calculations.macros.carbs.calories,
      carbs_percentage: calculations.macros.carbs.percentage,
      fats_grams: calculations.macros.fats.grams,
      fats_calories: calculations.macros.fats.calories,
      fats_percentage: calculations.macros.fats.percentage,
    };

    const result = await apiService.saveOnboardingData(payload);
    return { success: true, data: result };
  } catch (error: any) {
    if (__DEV__) console.error("Ошибка сохранения данных:", error);

    let errorMessage = "Ошибка при сохранении данных";
    
    if (error.response) {
      
      const status = error.response.status;
      const detail = error.response.data?.detail;
      
      if (status === 401) {
        errorMessage = "Ошибка авторизации. Попробуйте войти снова.";
      } else if (status === 422) {
        errorMessage = "Некорректные данные: " + (detail || "проверьте заполненные поля");
      } else if (status === 500) {
        errorMessage = "Ошибка сервера. Попробуйте позже.";
      } else {
        errorMessage = detail || `Ошибка сервера (${status})`;
      }
    } else if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      errorMessage = "Сервер не отвечает. Проверьте подключение.";
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      errorMessage = "Не удалось подключиться к серверу.";
    } else {
      errorMessage = error.message || "Неизвестная ошибка";
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function getOnboardingData() {
  try {
    const data = await apiService.getOnboardingData();
    return { success: true, data };
  } catch (error: any) {
    if (__DEV__) console.error("Error getting onboarding data:", error);
    return {
      success: false,
      error: error.message || "Ошибка при получении данных",
    };
  }
}
