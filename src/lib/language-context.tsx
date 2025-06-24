import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Language, TranslationKey } from './i18n';
import { getStoredLanguage, setStoredLanguage } from './i18n';

// Import translation files
import enTranslations from './translations/en.json';
import viTranslations from './translations/vi.json';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TranslationKey;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, TranslationKey> = {
  en: enTranslations as TranslationKey,
  vi: viTranslations as TranslationKey,
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage());

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    setStoredLanguage(newLanguage);
  };

  const t = translations[language];

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export type { Language }; 