# Guide d'intégration des traductions

Ce guide montre comment ajouter le support des traductions à différentes pages de l'application.

## Étape 1 : Identifier la table de traductions

Chaque page utilise une table spécifique. Par exemple :
- Achievements → `TLAchievementLooks`
- Skills → `TLSkillLooks_Common`, `TLSkillLooks_L01`, etc.
- Items → `TLItemLooks`
- Fishing → `TLFishingFishInfo`

Vérifiez dans le fichier `Game.gz` quelle table correspond à vos données :

```javascript
// Node.js - Explorer le fichier de traductions
const fs = require('fs');
const zlib = require('zlib');
const data = fs.readFileSync('public/data/translations/fr/Game.gz');
const json = JSON.parse(zlib.gunzipSync(data).toString());
console.log('Tables disponibles:', Object.keys(json));
```

## Étape 2 : Modifier votre interface de données

Ajoutez des champs pour stocker les clés de traduction :

```tsx
// Avant
interface ItemRow {
  id: string;
  name: string;
  description: string;
}

// Après
interface ItemRow {
  id: string;
  name: string;
  nameKey: string;        // ← Clé pour la traduction
  description: string;
  descriptionKey: string; // ← Clé pour la traduction
}
```

## Étape 3 : Stocker les clés lors du chargement des données

Modifiez votre fonction de chargement pour extraire les clés :

```tsx
async function loadData(): Promise<ItemRow[]> {
  const data = await fetchGzJson("/data/TLItemLooks.gz") as DataFile;
  const rows = data[0].Rows;
  
  return Object.entries(rows).map(([id, item]) => ({
    id,
    name: item.NameText?.LocalizedString ?? "",
    nameKey: item.NameText?.Key ?? "",
    description: item.DescriptionText?.LocalizedString ?? "",
    descriptionKey: item.DescriptionText?.Key ?? "",
  }));
}
```

## Étape 4 : Utiliser le hook dans votre composant

```tsx
import { useTranslation } from "@/lib/i18n";

export default function MyPage() {
  const { t } = useTranslation("TLItemLooks"); // ← Spécifier la table
  const [data, setData] = useState<ItemRow[]>([]);
  
  // Charger les données...
  
  return (
    <div>
      {data.map(item => (
        <div key={item.id}>
          <h3>{t(item.nameKey, item.name)}</h3>
          <p>{t(item.descriptionKey, item.description)}</p>
        </div>
      ))}
    </div>
  );
}
```

## Étape 5 : Intégrer dans un DataTable

Pour les colonnes d'un tableau utilisant `react-table` :

```tsx
const columns: ColumnDef<ItemRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: (info) => {
      const row = info.row.original;
      return t(row.nameKey, row.name);
    }
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: (info) => {
      const row = info.row.original;
      return t(row.descriptionKey, row.description);
    }
  }
];
```

## Exemples pour différentes pages

### Page Fishing

```tsx
// src/app/fishing/page.tsx
import { useTranslation } from "@/lib/i18n";

interface FishRow {
  id: string;
  name: string;
  nameKey: string;
}

export default function FishingPage() {
  const { t } = useTranslation("TLFishingFishInfo");
  // ... reste du code
}
```

### Page Skills

```tsx
// src/app/weapons/[weapon]/page.tsx
import { useTranslation } from "@/lib/i18n";

export default function WeaponPage() {
  // Pour les skills, il y a plusieurs tables selon l'arme
  const { t } = useTranslation("TLSkillLooks_Common");
  
  // Si besoin de plusieurs tables, utilisez plusieurs hooks
  const common = useTranslation("TLSkillLooks_Common");
  const bow = useTranslation("TLSkillPcLooks_Weapon_Bow");
  
  // Utiliser : common.t(...) ou bow.t(...)
}
```

### Page Items

```tsx
// src/app/items/page.tsx
import { useTranslation } from "@/lib/i18n";

interface ItemRow {
  id: string;
  nameKey: string;
  name: string;
  descKey: string;
  desc: string;
}

export default function ItemsPage() {
  const { t } = useTranslation("TLItemLooks");
  
  const columns = [
    {
      accessorKey: "name",
      header: "Item Name",
      cell: (info) => t(info.row.original.nameKey, info.row.original.name)
    },
    {
      accessorKey: "desc",
      header: "Description",
      cell: (info) => t(info.row.original.descKey, info.row.original.desc)
    }
  ];
  
  return <DataTable data={items} columns={columns} />;
}
```

## Cas spéciaux

### Traduire des énumérations

Si vous avez des valeurs d'énums à traduire :

```tsx
const { t } = useTranslation("TLEnumTextData");

// Exemple : traduire un type de rareté
const rarityKey = `Rarity_${item.rarity}`;
const rarityLabel = t(rarityKey, item.rarity);
```

### Traductions manquantes

Le système utilise automatiquement le fallback si la traduction n'existe pas :

```tsx
// Si la clé n'existe pas dans le fichier de traductions,
// la valeur par défaut (anglais) sera utilisée
const text = t("missing_key", "Default English Text");
// → Retourne "Default English Text"
```

### Plusieurs tables pour une même page

```tsx
function ComplexPage() {
  const achievements = useTranslation("TLAchievementLooks");
  const items = useTranslation("TLItemLooks");
  const skills = useTranslation("TLSkillLooks_Common");
  
  return (
    <div>
      <p>{achievements.t(achievementKey, achievementFallback)}</p>
      <p>{items.t(itemKey, itemFallback)}</p>
      <p>{skills.t(skillKey, skillFallback)}</p>
    </div>
  );
}
```

## Debugging

Pour vérifier si une traduction existe :

```tsx
import { useI18n } from "@/lib/i18n";

function DebugComponent() {
  const { translations, locale } = useI18n();
  
  useEffect(() => {
    if (translations && locale !== "en") {
      console.log("Available tables:", Object.keys(translations));
      console.log("Keys in TLAchievementLooks:", 
        Object.keys(translations.TLAchievementLooks || {}).slice(0, 10)
      );
    }
  }, [translations, locale]);
  
  return null;
}
```

## Checklist pour ajouter les traductions à une page

- [ ] Identifier la ou les tables de traductions nécessaires
- [ ] Modifier l'interface pour ajouter les champs `*Key`
- [ ] Modifier la fonction de chargement pour extraire les clés
- [ ] Importer et utiliser `useTranslation("TableName")`
- [ ] Remplacer l'affichage direct par `t(key, fallback)`
- [ ] Tester avec différentes langues
- [ ] Vérifier que le fallback fonctionne si traduction manquante

## Bonnes pratiques

1. **Toujours fournir un fallback** : `t(key, fallback)` - jamais `t(key)`
2. **Stocker les clés dans les données** : Ne pas perdre les clés quand on charge les données
3. **Nommer les champs de clés de façon cohérente** : `titleKey`, `descriptionKey`, `nameKey`
4. **Utiliser le bon nom de table** : Vérifier dans le fichier de traductions
5. **Ne pas recharger les données** : Les traductions s'appliquent automatiquement, pas besoin de recharger

## Performances

- Les traductions sont **mises en cache** après le premier chargement
- Le changement de langue **ne recharge pas les données**, seulement les traductions
- Les colonnes avec `cell: (info) => t(...)` se **re-renderisent automatiquement**

