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

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    'settings.language': 'Language',
    'settings.language.title': 'App Language',
    'food.search.placeholder': 'Search foods...',
    'food.database': 'Food Database',
    'food.sources.all': 'All Sources',
    'food.sources.foundation': 'USDA Foundation',
    'food.sources.branded': 'Branded',
    'food.sources.survey': 'Survey',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.loading': 'Loading...',
    'common.noResults': 'No results found',
  },
  ru: {
    'settings.language': 'Язык',
    'settings.language.title': 'Язык приложения',
    'food.search.placeholder': 'Поиск продуктов...',
    'food.database': 'База продуктов',
    'food.sources.all': 'Все источники',
    'food.sources.foundation': 'USDA Foundation',
    'food.sources.branded': 'Брендовые',
    'food.sources.survey': 'Опросы',
    'common.cancel': 'Отмена',
    'common.save': 'Сохранить',
    'common.loading': 'Загрузка...',
    'common.noResults': 'Ничего не найдено',
  },
  uz: {
    'settings.language': 'Til',
    'settings.language.title': 'Ilova tili',
    'food.search.placeholder': "Mahsulotlarni qidirish...",
    'food.database': "Mahsulotlar bazasi",
    'food.sources.all': "Barcha manbalar",
    'food.sources.foundation': 'USDA Foundation',
    'food.sources.branded': 'Brendli',
    'food.sources.survey': "So'rovnomalar",
    'common.cancel': 'Bekor qilish',
    'common.save': 'Saqlash',
    'common.loading': 'Yuklanmoqda...',
    'common.noResults': 'Hech narsa topilmadi',
  }
};

export const t = (key: string, lang?: SupportedLanguage): string => {
  const currentLang = lang || cachedLanguage;
  return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS.en[key] || key;
};
