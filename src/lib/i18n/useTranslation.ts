import { useI18n } from "./I18nContext";
import { translateLocalizedString } from "./translations";

export function useTranslation(tableName: string | string[]) {
  const { translations, fallbackTranslations } = useI18n();

  const t = (
      keyOrLocalized: string | { LocalizedString: string } | undefined,
      fallback = ""
  ): string => {
    if (!keyOrLocalized) {
      return fallback;
    }

    // LocalizedString
    if (typeof keyOrLocalized === "object" && "LocalizedString" in keyOrLocalized) {
      return translateLocalizedString(translations,
          Array.isArray(tableName) ? tableName[0] : tableName,
          keyOrLocalized
      );
    }

    // Simple key - try each table
    const tableNames = Array.isArray(tableName) ? tableName : [tableName];

    for (const table of tableNames) {
      // Try to translate in current local
      if (translations && translations[table] && translations[table][keyOrLocalized]) {
        return translations[table][keyOrLocalized];
      }

      // Fallback on english if not found
      if (fallbackTranslations && fallbackTranslations[table] && fallbackTranslations[table][keyOrLocalized]) {
        return fallbackTranslations[table][keyOrLocalized];
      }
    }

    return fallback;
  };

  return { t };
}