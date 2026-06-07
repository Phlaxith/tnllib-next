import { useI18n } from "./I18nContext";
import { translate, translateLocalizedString } from "./translations";

/**
 * Hook to use translations in a component
 * Return a function `t` that translate a given key
 */
export function useTranslation(tableName: string | string[]) {
  const { translations } = useI18n();

  /**
   * Translate key or LocalizedString
   */
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
      const result = translate(translations, table, keyOrLocalized, keyOrLocalized);
      // If result is different from the key, we found a translation
      if (result && result !== keyOrLocalized) {
        return result;
      }
    }

    return fallback;
  };

  return { t };
}

