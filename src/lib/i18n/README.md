# Système de traductions i18n

Ce système permet de traduire les textes de l'application en utilisant les fichiers de traductions du jeu (fichiers `.gz`).

## Structure des fichiers

```
src/lib/i18n/
├── I18nContext.tsx      # Context React pour la gestion de la locale
├── translations.ts      # Utilitaires pour charger et mapper les traductions
├── useTranslation.ts    # Hook React pour utiliser les traductions
├── index.ts             # Point d'entrée du module
└── README.md            # Cette documentation
```

## Installation

Le système est déjà intégré dans l'application via le `I18nProvider` dans `app/layout.tsx`.

## Fichiers de traductions

Les fichiers de traductions doivent être placés dans :
```
public/data/translations/{locale}/Game_3.34.1.gz
```

Locales supportées : `en`, `fr`, `de`, `es`, `ja`, `ko`, `zh`

**Note** : Pour l'anglais (`en`), aucun fichier n'est nécessaire car c'est la langue par défaut.

## Utilisation dans un composant

### 1. Importer le hook

```tsx
import { useTranslation } from "@/lib/i18n";
```

### 2. Utiliser le hook dans votre composant

```tsx
function MyComponent() {
  // Spécifier le nom de la table de traductions
  const { t } = useTranslation("TLAchievementLooks");
  
  // Utiliser t() pour traduire avec une clé et un fallback
  const title = t("achv_combat_001_TitleText", "Default Title");
  
  return <div>{title}</div>;
}
```

### 3. Exemple complet avec des données

```tsx
interface DataRow {
  id: string;
  TitleKey: string;
  Title: string;
  DescriptionKey: string;
  Description: string;
}

function AchievementsPage() {
  const { t } = useTranslation("TLAchievementLooks");
  const [data, setData] = useState<DataRow[]>([]);
  
  const columns = [
    {
      accessorKey: "Title",
      header: "Title",
      cell: (info) => {
        const row = info.row.original;
        // Traduit avec la clé, sinon utilise la valeur par défaut
        return t(row.TitleKey, row.Title);
      }
    },
    {
      accessorKey: "Description",
      header: "Description",
      cell: (info) => {
        const row = info.row.original;
        return t(row.DescriptionKey, row.Description);
      }
    }
  ];
  
  return <DataTable data={data} columns={columns} />;
}
```

## Sélecteur de langue

Un sélecteur de langue (`LanguageSelector`) est déjà intégré dans la Sidebar. L'utilisateur peut changer de langue et sa préférence est sauvegardée dans `localStorage`.

## Accès au contexte i18n

Si vous avez besoin d'accéder directement au contexte (par exemple pour connaître la locale actuelle) :

```tsx
import { useI18n } from "@/lib/i18n";

function MyComponent() {
  const { locale, setLocale, translations, isLoading } = useI18n();
  
  return (
    <div>
      <p>Current locale: {locale}</p>
      {isLoading && <p>Loading translations...</p>}
    </div>
  );
}
```

## Fonctions utilitaires

### `translate()`

Traduit une clé spécifique avec fallback :

```tsx
import { translate } from "@/lib/i18n";

const translated = translate(
  translations,        // Les données de traduction (depuis useI18n())
  "TLAchievementLooks", // Nom de la table
  "achv_combat_001_TitleText", // Clé
  "Default Text"       // Fallback
);
```

### `translateLocalizedString()`

Traduit un objet `LocalizedString` (structure UE) :

```tsx
import { translateLocalizedString } from "@/lib/i18n";

const obj = {
  LocalizedString: "achv_combat_001_TitleText"
};

const translated = translateLocalizedString(
  translations,
  "TLAchievementLooks",
  obj
);
```

### `loadTranslations()`

Charge manuellement un fichier de traductions (rarement nécessaire, géré automatiquement par le contexte) :

```tsx
import { loadTranslations } from "@/lib/i18n";

const translations = await loadTranslations("fr");
```

## Structure des fichiers de traductions

Les fichiers `.gz` contiennent un JSON avec cette structure :

```json
{
  "TLAchievementLooks": {
    "achv_combat_001_TitleText": "Titre traduit",
    "achv_combat_001_Description": "Description traduite",
    ...
  },
  "TLSkillLooks": {
    ...
  }
}
```

## Cache

Les fichiers de traductions sont mis en cache une fois chargés pour éviter les rechargements inutiles.

## Notes importantes

- **Fallback automatique** : Si une traduction n'existe pas, la valeur par défaut (en anglais) est utilisée
- **Performances** : Les traductions sont appliquées à la volée dans les cellules du tableau, ce qui permet de changer de langue sans recharger les données
- **Compatibilité** : Le système fonctionne avec la structure des fichiers de traductions du jeu Throne & Liberty

