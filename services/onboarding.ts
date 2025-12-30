
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
    const missingFields: string[] = [];
    if (!data.gender) missingFields.push("gender");
    if (!data.height) missingFields.push("height");
    if (!data.weight) missingFields.push("weight");
    if (!data.workoutFrequency) missingFields.push("workoutFrequency");
    if (!data.goal) missingFields.push("goal");
    
    if (missingFields.length > 0) {
      throw new Error(`Недостаточно данных для расчета. Отсутствуют: ${missingFields.join(", ")}`);
    }

    let age = 25; 
    if (data.birthDate) {
      const today = new Date();
      // birthDate может быть строкой из AsyncStorage
      const birth = typeof data.birthDate === 'string' ? new Date(data.birthDate) : new Date(data.birthDate);
      age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
    }

    const gender = data.gender!;
    const height = data.height!;
    const weight = data.weight!;
    const workoutFrequency = data.workoutFrequency!;
    const goal = data.goal!;

    const userData: UserData = {
      gender,
      age,
      height,
      weight,
      workoutFrequency,
      goal,
    };

    const calculations = calculateCalories(userData);

    let birthDateStr: string | undefined;
    if (data.birthDate) {
      const birthDateValue = data.birthDate as Date | string;
      if (typeof birthDateValue === 'string') {
        birthDateStr = birthDateValue.split("T")[0];
      } else {
        const year = birthDateValue.getFullYear();
        const month = String(birthDateValue.getMonth() + 1).padStart(2, '0');
        const day = String(birthDateValue.getDate()).padStart(2, '0');
        birthDateStr = `${year}-${month}-${day}`;
      }
    }

    const payload = {
      gender,
      workout_frequency: workoutFrequency,
      height,
      weight,
      birth_date: birthDateStr,
      has_trainer: data.hasTrainer,
      goal,
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
    return {
      success: false,
      error: error.message || "Ошибка при получении данных",
    };
  }
}
