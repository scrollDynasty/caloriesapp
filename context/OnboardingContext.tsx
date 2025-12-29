import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { OnboardingData } from "../services/onboarding";

const ONBOARDING_DATA_KEY = "@yebich:onboarding_data";

interface OnboardingContextType {
  data: Partial<OnboardingData>;
  updateData: (stepData: Partial<OnboardingData>) => void;
  clearData: () => void;
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
          setData(parsed);
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
    const newData = { ...data, ...stepData };
    setData(newData);
    try {
      await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(newData));
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
