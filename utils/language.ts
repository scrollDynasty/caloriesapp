import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const LANGUAGE_KEY = '@yebich:language';

export type SupportedLanguage = 'en' | 'ru' | 'uz';

export const getDeviceLanguage = (): SupportedLanguage => {
  let deviceLanguage = 'en';
  
  try {
    if (Platform.OS === 'ios') {
      deviceLanguage = 
        NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        'en';
    } else if (Platform.OS === 'android') {
      deviceLanguage = NativeModules.I18nManager?.localeIdentifier || 'en';
    }
  } catch (e) {
    console.warn('Failed to get device language:', e);
  }
  
  const langCode = deviceLanguage.toLowerCase().split(/[-_]/)[0];
  
  if (langCode === 'ru') return 'ru';
  if (langCode === 'uz') return 'uz';
  return 'en';
};

export const setUserLanguage = async (lang: SupportedLanguage): Promise<void> => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
};

export const getUserLanguage = async (): Promise<SupportedLanguage> => {
  try {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLang && ['en', 'ru', 'uz'].includes(savedLang)) {
      return savedLang as SupportedLanguage;
    }
  } catch (e) {
    console.warn('Failed to get saved language:', e);
  }
  
  return getDeviceLanguage();
};

let cachedLanguage: SupportedLanguage = 'en';

export const initLanguage = async (): Promise<SupportedLanguage> => {
  cachedLanguage = await getUserLanguage();
  return cachedLanguage;
};

export const getCurrentLanguage = (): SupportedLanguage => {
  return cachedLanguage;
};

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  ru: 'Русский',
  uz: "O'zbekcha"
};
