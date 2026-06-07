"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Locale, type TranslationData, loadTranslations } from "./translations";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  translations: TranslationData | null;
  fallbackTranslations: TranslationData | null;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Init with locale if set
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("locale") as Locale | null;
      if (saved) return saved;
    }
    return "en";
  });
  const [translations, setTranslations] = useState<TranslationData | null>(null);
  const [fallbackTranslations, setFallbackTranslations] = useState<TranslationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load English translations as fallback (only once)
  useEffect(() => {
    loadTranslations("en")
        .then((data: TranslationData) => {
          setFallbackTranslations(data);
        })
        .catch(() => {
          setFallbackTranslations(null);
        });
  }, []);

  // Load translations on locale change
  useEffect(() => {
    if (locale === "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTranslations(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    loadTranslations(locale)
        .then((data: TranslationData) => {
          setTranslations(data);
          setIsLoading(false);
        })
        .catch(() => {
          setTranslations(null);
          setIsLoading(false);
        });
  }, [locale]);

  // Save preferences in localStorage
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", newLocale);
    }
  };

  return (
      <I18nContext.Provider value={{ locale, setLocale, translations, fallbackTranslations, isLoading }}>
        {children}
      </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}