import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { TRANSLATIONS } from '../locales/translations';
import {
    getCurrentLanguage,
    initLanguage,
    setUserLanguage,
    SupportedLanguage,
} from '../utils/language';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string) => string;
  isLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize language on app start
  useEffect(() => {
    const initApp = async () => {
      try {
        await initLanguage();
        const lang = getCurrentLanguage();
        setLanguageState(lang);
      } catch (e) {
        console.warn('Failed to initialize language:', e);
      } finally {
        setIsLoaded(true);
      }
    };

    initApp();
  }, []);

  // Listen for app state changes and sync language
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = useCallback(async (state: AppStateStatus) => {
    if (state === 'active') {
      // Sync language when app comes to foreground
      const lang = getCurrentLanguage();
      setLanguageState(lang);
    }
  }, []);

  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    try {
      await setUserLanguage(lang);
      setLanguageState(lang);
    } catch (e) {
      console.warn('Failed to set language:', e);
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;
    },
    [language]
  );

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isLoaded,
  };

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
