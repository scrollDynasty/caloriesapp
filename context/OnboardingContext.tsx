/**
 * Контекст для хранения данных онбординга
 */
import React, { createContext, ReactNode, useContext, useState } from "react";
import { OnboardingData } from "../services/onboarding";

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

  const updateData = (stepData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...stepData }));
  };

  const clearData = () => {
    setData({});
  };

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
