import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const SNOW_ENABLED_KEY = "@yebich:snow_enabled";

interface SnowContextType {
  isSnowEnabled: boolean;
  toggleSnow: () => void;
  setSnowEnabled: (enabled: boolean) => void;
}

const SnowContext = createContext<SnowContextType | undefined>(undefined);

interface SnowProviderProps {
  children: ReactNode;
}

export function SnowProvider({ children }: SnowProviderProps) {
  // ОПТИМИЗАЦИЯ: Снег отключён по умолчанию для экономии батареи
  const [isSnowEnabled, setIsSnowEnabled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSnowPreference();
  }, []);

  // Не рендерим пока не загрузили настройку
  const loadSnowPreference = async () => {
    try {
      const stored = await AsyncStorage.getItem(SNOW_ENABLED_KEY);
      // Снег включается только если явно включён пользователем
      if (stored !== null) {
        setIsSnowEnabled(JSON.parse(stored) === true);
      }
      setIsLoaded(true);
    } catch (error) {
      if (__DEV__) console.error("Error loading snow preference:", error);
      setIsLoaded(true);
    }
  };

  const saveSnowPreference = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(SNOW_ENABLED_KEY, JSON.stringify(enabled));
    } catch (error) {
      if (__DEV__) console.error("Error saving snow preference:", error);
    }
  };

  const toggleSnow = useCallback(() => {
    setIsSnowEnabled((prev) => {
      const newValue = !prev;
      saveSnowPreference(newValue);
      return newValue;
    });
  }, []);

  const setSnowEnabled = useCallback((enabled: boolean) => {
    setIsSnowEnabled(enabled);
    saveSnowPreference(enabled);
  }, []);

  return (
    <SnowContext.Provider value={{ isSnowEnabled, toggleSnow, setSnowEnabled }}>
      {children}
    </SnowContext.Provider>
  );
}

export function useSnow(): SnowContextType {
  const context = useContext(SnowContext);
  if (context === undefined) {
    throw new Error("useSnow must be used within a SnowProvider");
  }
  return context;
}

export { SnowContext };
