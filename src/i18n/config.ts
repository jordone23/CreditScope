import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './resources';

export const LOCALE_STORAGE_KEY = 'creditscope.locale.v1';
export type SupportedLanguage = 'pl' | 'en';

function storedLanguage(): SupportedLanguage {
  try {
    const value = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return value === 'pl' ? 'pl' : 'en';
  } catch {
    return 'en';
  }
}

void i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  lng: storedLanguage(),
  resources,
  supportedLngs: ['pl', 'en'],
});

export function localeFor(language: string) {
  return language.startsWith('en') ? 'en-GB' : 'pl-PL';
}

export function setLanguage(language: SupportedLanguage) {
  void i18n.changeLanguage(language);
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, language);
  } catch {
    // The application remains usable when storage is unavailable.
  }
  document.documentElement.lang = localeFor(language);
}

document.documentElement.lang = localeFor(i18n.language);

export default i18n;
