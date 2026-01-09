import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { apiService } from "../services/api";
import { dataCache } from "../stores/dataCache";
import { getLocalDayRange } from "../utils/timezone";

export interface ProcessingMeal {
  id: string;
  uri: string;
  fileName: string;
  mimeType: string;
  barcode?: string;
  progress: number;
  status: "uploading" | "processing" | "finalizing" | "completed" | "error";
  statusText: string;
  startedAt: Date;
  result?: {
    photoId: number;
    mealName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    healthScore: number | null;
    imageUrl: string;
  };
  error?: string;
}

interface ProcessingMealsContextType {
  processingMeals: ProcessingMeal[];
  addProcessingMeal: (
    uri: string,
    fileName: string,
    mimeType: string,
    barcode?: string
  ) => string;
  getProcessingMeal: (id: string) => ProcessingMeal | undefined;
  removeProcessingMeal: (id: string) => void;
  hasProcessingMeals: boolean;
  onMealCompleted?: (meal: ProcessingMeal) => void;
  setOnMealCompleted: (callback: ((meal: ProcessingMeal) => void) | undefined) => void;
}

const ProcessingMealsContext = createContext<ProcessingMealsContextType | null>(null);

export function useProcessingMeals() {
  const context = useContext(ProcessingMealsContext);
  if (!context) {
    throw new Error("useProcessingMeals must be used within ProcessingMealsProvider");
  }
  return context;
}

export function ProcessingMealsProvider({ children }: { children: React.ReactNode }) {
  const [processingMeals, setProcessingMeals] = useState<ProcessingMeal[]>([]);
  const onMealCompletedRef = useRef<((meal: ProcessingMeal) => void) | undefined>(undefined);
  
  const updateMeal = useCallback((id: string, updates: Partial<ProcessingMeal>) => {
    setProcessingMeals(prev => 
      prev.map(meal => meal.id === id ? { ...meal, ...updates } : meal)
    );
  }, []);

  const processUpload = useCallback(async (meal: ProcessingMeal) => {
    const { id, uri, fileName, mimeType, barcode } = meal;
    
    try {
      updateMeal(id, { 
        progress: 10, 
        status: "uploading", 
        statusText: "Загружаем фото..." 
      });
      
      const progressInterval = setInterval(() => {
        setProcessingMeals(prev => {
          const current = prev.find(m => m.id === id);
          if (current && current.status === "uploading" && current.progress < 30) {
            return prev.map(m => m.id === id ? { ...m, progress: Math.min(30, m.progress + 5) } : m);
          }
          return prev;
        });
      }, 200);

      const response = await apiService.uploadMealPhoto(uri, fileName, mimeType, barcode);
      
      clearInterval(progressInterval);
      
      updateMeal(id, { 
        progress: 40, 
        status: "processing", 
        statusText: "AI анализирует блюдо..." 
      });
      
      const processingInterval = setInterval(() => {
        setProcessingMeals(prev => {
          const current = prev.find(m => m.id === id);
          if (current && current.status === "processing" && current.progress < 70) {
            return prev.map(m => m.id === id ? { ...m, progress: Math.min(70, m.progress + 10) } : m);
          }
          return prev;
        });
      }, 300);
      
      await new Promise<void>(resolve => setTimeout(resolve, 800));
      clearInterval(processingInterval);
      
      updateMeal(id, { 
        progress: 85, 
        status: "finalizing", 
        statusText: "Завершаем результаты..." 
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const imageUrl = apiService.getMealPhotoUrl(
        response.photo.id,
        apiService.getCachedToken() || undefined
      );
      
      const completedMeal: ProcessingMeal = {
        ...meal,
        progress: 100,
        status: "completed",
        statusText: "Готово!",
        result: {
          photoId: response.photo.id,
          mealName: response.photo.detected_meal_name || response.photo.meal_name || "Блюдо",
          calories: response.photo.calories || 0,
          protein: response.photo.protein || 0,
          carbs: response.photo.carbs || 0,
          fat: response.photo.fat || 0,
          fiber: response.photo.fiber || 0,
          sugar: response.photo.sugar || 0,
          sodium: response.photo.sodium || 0,
          healthScore: response.photo.health_score ?? null,
          imageUrl,
        },
      };
      
      updateMeal(id, completedMeal);
      
      const { dateStr } = getLocalDayRange();
      dataCache.invalidateDailyMeals(dateStr);
      
      if (onMealCompletedRef.current) {
        onMealCompletedRef.current(completedMeal);
      } else {
        setTimeout(() => {
          setProcessingMeals(prev => prev.filter(m => m.id !== id));
        }, 5000);
      }
      
    } catch (error: any) {
      updateMeal(id, {
        status: "error",
        statusText: "Ошибка загрузки",
        error: error.response?.data?.detail || error.message || "Не удалось загрузить фото",
      });
      
      setTimeout(() => {
        setProcessingMeals(prev => prev.filter(m => m.id !== id));
      }, 5000);
    }
  }, [updateMeal]);

  const addProcessingMeal = useCallback((
    uri: string,
    fileName: string,
    mimeType: string,
    barcode?: string
  ): string => {
    const id = `processing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newMeal: ProcessingMeal = {
      id,
      uri,
      fileName,
      mimeType,
      barcode,
      progress: 0,
      status: "uploading",
      statusText: "Подготовка...",
      startedAt: new Date(),
    };
    
    setProcessingMeals(prev => [newMeal, ...prev]);
    
    processUpload(newMeal);
    
    return id;
  }, [processUpload]);

  const getProcessingMeal = useCallback((id: string) => {
    return processingMeals.find(meal => meal.id === id);
  }, [processingMeals]);

  const removeProcessingMeal = useCallback((id: string) => {
    setProcessingMeals(prev => prev.filter(meal => meal.id !== id));
  }, []);

  const setOnMealCompleted = useCallback((callback: ((meal: ProcessingMeal) => void) | undefined) => {
    onMealCompletedRef.current = callback;
  }, []);

  return (
    <ProcessingMealsContext.Provider
      value={{
        processingMeals,
        addProcessingMeal,
        getProcessingMeal,
        removeProcessingMeal,
        hasProcessingMeals: processingMeals.length > 0,
        onMealCompleted: onMealCompletedRef.current,
        setOnMealCompleted,
      }}
    >
      {children}
    </ProcessingMealsContext.Provider>
  );
}

