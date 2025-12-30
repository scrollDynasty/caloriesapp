import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { OnboardingData } from "../services/onboarding";

const ONBOARDING_DATA_KEY = "@yebich:onboarding_data";

interface OnboardingContextType {
  data: Partial<OnboardingData>;
  updateData: (stepData: Partial<OnboardingData>) => Promise<void>;
  clearData: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (__DEV__) {
            console.log("📂 OnboardingContext: Loaded data from storage:", Object.keys(parsed));
          }
          setData(parsed);
        } else {
          if (__DEV__) console.log("📂 OnboardingContext: No stored data found");
        }
      } catch (error) {
        if (__DEV__) console.error("Error loading onboarding data:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  const updateData = async (stepData: Partial<OnboardingData>) => {
    if (__DEV__) {
      console.log("📝 OnboardingContext: Updating data with:", Object.keys(stepData));
    }
    const newData = { ...data, ...stepData };
    setData(newData);
    try {
      await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(newData));
      if (__DEV__) {
        console.log("💾 OnboardingContext: Saved to AsyncStorage. Current keys:", Object.keys(newData));
      }
    } catch (error) {
      if (__DEV__) console.error("Error saving onboarding data:", error);
    }
  };

  const clearData = async () => {
    setData({});
    try {
      await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
    } catch (error) {
      if (__DEV__) console.error("Error clearing onboarding data:", error);
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <OnboardingContext.Provider value={{ data, updateData, clearData }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
