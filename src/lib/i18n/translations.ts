import { fetchGzJson } from "@/lib/utils";

// Types pour les traductions
export type Locale = "en" | "fr"

export type TranslationData = Record<string, Record<string, string>>;

// Cache des traductions chargées : locale → data
const translationCache = new Map<Locale, TranslationData>();

/**
 * Charge le fichier de traductions pour une locale donnée
 */
export async function loadTranslations(locale: Locale): Promise<TranslationData> {
  if (translationCache.has(locale)) {
    return translationCache.get(locale)!;
  }

  try {
    // Charger le fichier de traductions (ajustez le nom de fichier selon vos besoins)
    const data = await fetchGzJson(`/data/translations/${locale}/Game.gz`) as TranslationData;
    translationCache.set(locale, data);
    return data;
  } catch (error) {
    console.warn(`Failed to load translations for locale "${locale}":`, error);
    return {};
  }
}

/**
 * Obtenir une traduction d'un champ spécifique
 * @param translations - Les données de traduction chargées
 * @param tableName - Le nom de la table (ex: "TLAchievementLooks")
 * @param key - La clé du champ (ex: "Achivement_CO_MagicDoll_Auto_PickUp_TitleText")
 * @param fallback - Valeur par défaut si la traduction n'existe pas
 */
export function translate(
  translations: TranslationData | null,
  tableName: string,
  key: string,
  fallback: string
): string {
  if (!translations || !tableName || !key) {
    return fallback;
  }

  const table = translations[tableName];
  if (!table) {
    return fallback;
  }

  const value = table[key];
  return value ?? fallback;
}

/**
 * Helper pour traduire un objet LocalizedString depuis les fichiers .gz
 * @param translations - Les données de traduction chargées
 * @param tableName - Le nom de la table
 * @param localized - L'objet contenant { LocalizedString: string }
 */
export function translateLocalizedString(
  translations: TranslationData | null,
  tableName: string,
  localized: { LocalizedString: string } | undefined
): string {
  if (!localized?.LocalizedString) {
    return "";
  }

  return translate(translations, tableName, localized.LocalizedString, localized.LocalizedString);
}

