import { createContext, useContext, useState, useCallback } from 'react';
import en from '../i18n/en.json';
import ka from '../i18n/ka.json';

const translations = { en, ka };

const LanguageContext = createContext(null);

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('language') || 'ka';
  });

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  }, []);

  const t = useCallback((key) => {
    const value = getNestedValue(translations[language], key);
    if (value !== undefined) return value;
    // Fallback to English
    const fallback = getNestedValue(translations.en, key);
    if (fallback !== undefined) return fallback;
    return key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
