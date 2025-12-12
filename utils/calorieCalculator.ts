

export interface UserData {
  gender: "male" | "female";
  age: number; 
  height: number; 
  weight: number; 
  workoutFrequency: "0-2" | "3-5" | "6+"; 
  goal: "lose" | "maintain" | "gain"; 
}

export interface CalorieResult {
  bmr: number; 
  tdee: number; 
  targetCalories: number; 
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

function calculateBMR(data: UserData): number {
  const { gender, age, height, weight } = data;

  const baseBMR = 10 * weight + 6.25 * height - 5 * age;
  const genderFactor = gender === "male" ? 5 : -161;

  return Math.round(baseBMR + genderFactor);
}

function getActivityFactor(workoutFrequency: UserData["workoutFrequency"]): number {
  switch (workoutFrequency) {
    case "0-2":
      return 1.2; 
    case "3-5":
      return 1.55; 
    case "6+":
      return 1.725; 
    default:
      return 1.2;
  }
}

function calculateTargetCalories(
  tdee: number,
  goal: UserData["goal"],
  gender: UserData["gender"]
): number {
  switch (goal) {
    case "lose":

      const deficit = 500;
      const minCalories = gender === "male" ? 1500 : 1200; 
      return Math.max(Math.round(tdee - deficit), minCalories);
    case "gain":
      
      return Math.round(tdee + 400);
    case "maintain":
    default:
      
      return Math.round(tdee);
  }
}

function calculateMacros(
  targetCalories: number,
  weight: number,
  goal: UserData["goal"]
): CalorieResult["macros"] {

  let proteinGrams: number;
  if (goal === "lose") {
    proteinGrams = weight * 2.2; 
  } else if (goal === "gain") {
    proteinGrams = weight * 2.0; 
  } else {
    proteinGrams = weight * 2.0; 
  }

  const proteinCalories = proteinGrams * 4; 
  const proteinPercentage = (proteinCalories / targetCalories) * 100;

  const fatGramsPerKg = goal === "lose" ? 0.9 : 1.0;
  const fatGrams = weight * fatGramsPerKg;
  const fatCalories = fatGrams * 9; 
  const fatPercentage = (fatCalories / targetCalories) * 100;

  const carbsCalories = targetCalories - proteinCalories - fatCalories;
  const carbsGrams = carbsCalories / 4; 
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

export function calculateCalories(data: UserData): CalorieResult {
  
  const bmr = calculateBMR(data);

  const activityFactor = getActivityFactor(data.workoutFrequency);
  const tdee = Math.round(bmr * activityFactor);

  const targetCalories = calculateTargetCalories(tdee, data.goal, data.gender);

  const macros = calculateMacros(targetCalories, data.weight, data.goal);

  return {
    bmr,
    tdee,
    targetCalories,
    macros,
  };
}
