import { useI18n } from "./I18nContext";
import { translate, translateLocalizedString } from "./translations";

/**
 * Hook to use translations in a component
 * Return a function `t` that translate a given key
 */
export function useTranslation(tableName: string) {
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
      return translateLocalizedString(translations, tableName, keyOrLocalized);
    }

    // Simple key
    return translate(translations, tableName, keyOrLocalized, fallback);
  };

  return { t };
}

