"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import DataTable from "@/components/ui/DataTable";
import { type ColumnDef } from "@tanstack/react-table";
import { Trophy, Sparkles } from "lucide-react";
import { fetchGzJson, unrealPathToPublic } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface AchievementRow {
  id: string;
  image: string;
  Title: string;
  TitleKey: string; // Key for translation
  Description: string;
  DescriptionKey: string; // Key for translation
  Category: string;
  CategoryKey: string; // Key for category translation
  Subcategory: string;
  SubcategoryKey: string; // Key for subcategory translation
  isNew?: boolean;
  // Champs pour la recherche (mis à jour avec les traductions)
  TranslatedTitle?: string;
  TranslatedDescription?: string;
  TranslatedCategory?: string;
  TranslatedSubcategory?: string;
}
interface VersionEntry { id: string; label: string; }

const ALL_FILES = [
  "TLAchievementLooks_BattleGround",
  "TLAchievementLooks_Combat",
  "TLAchievementLooks_Economy",
  "TLAchievementLooks_Housing",
  "TLAchievementLooks_Live",
  "TLAchievementLooks_Narrative",
  "TLAchievementLooks_World1",
  "TLAchievementLooks_World2",
  "TLAchievementLooks_World3",
];

type CatMap = Record<string, {
  ParentCategory?: { RowName: string };
  DisplayText?: { LocalizedString: string; Key: string };
}>;

async function loadSnapshot(basePath: string, catMap: CatMap): Promise<Map<string, AchievementRow>> {
  const results = await Promise.all(ALL_FILES.map((f) => fetchGzJson(`${basePath}/${f}.gz`).catch(() => null)));
  const map = new Map<string, AchievementRow>();
  for (const fileData of results) {
    if (!fileData) continue;
    const rows = (fileData as { Rows: Record<string, unknown> }[])[0].Rows;
    for (const [rowId, v] of Object.entries(rows)) {
      const e = v as {
        IconImage?: { AssetPathName: string };
        TitleText?: { LocalizedString: string; Key: string };
        Description?: { LocalizedString: string; Key: string };
        Category?: { RowName: string };
      };
      const catRow = e.Category?.RowName ? catMap[e.Category.RowName] : undefined;
      if (!catRow) continue;

      // Trouver la catégorie parent
      const parentCategoryName = catRow.ParentCategory?.RowName ?? "";
      const parentCategory = parentCategoryName ? catMap[parentCategoryName] : undefined;

      map.set(rowId, {
        id: rowId,
        image: unrealPathToPublic(e.IconImage?.AssetPathName),
        Title: e.TitleText?.LocalizedString ?? "",
        TitleKey: e.TitleText?.Key ?? "",
        Description: e.Description?.LocalizedString ?? "",
        DescriptionKey: e.Description?.Key ?? "",
        Category: parentCategoryName,
        CategoryKey: parentCategory?.DisplayText?.Key ?? "",
        Subcategory: catRow.DisplayText?.LocalizedString ?? "",
        SubcategoryKey: catRow.DisplayText?.Key ?? "",
      });
    }
  }
  console.log(map)

  return map;
}

export default function AchievementsPage() {
  const { t } = useTranslation(["TLAchievementLooks", "TLStringAchievement", "TLStringContents"]);
  const [displayData, setDisplayData] = useState<AchievementRow[]>([]);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [versionLoading, setVersionLoading] = useState(false);
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedSubcategories, setSelectedSubcategories] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Cache: path → snapshot map
  const snapshotCache = useRef<Map<string, Map<string, AchievementRow>>>(new Map());
  const catMapRef = useRef<CatMap>({});

  async function getSnapshot(path: string): Promise<Map<string, AchievementRow>> {
    if (snapshotCache.current.has(path)) return snapshotCache.current.get(path)!;
    const map = await loadSnapshot(path, catMapRef.current);
    snapshotCache.current.set(path, map);
    return map;
  }

  useEffect(() => {
    async function load() {
      try {
        const [manifest, catRaw] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/versions/manifest.json`).then((r) => r.json()) as Promise<VersionEntry[]>,
          fetchGzJson("/data/TLAchievementCategory.gz"),
        ]);
        const realVersions = (manifest as VersionEntry[]).filter((v) => v.id !== "all");

        // Merge catMaps de toutes les versions pour avoir un catMap global complet
        const versionCatRaws = await Promise.all(
          realVersions.map((v) => fetchGzJson(`/data/versions/${v.id}/TLAchievementCategory.gz`).catch(() => null))
        );
        let mergedCatMap: CatMap = ((catRaw as { Rows: CatMap }[])[0]).Rows;
        for (const vc of versionCatRaws) {
          if (vc) mergedCatMap = { ...mergedCatMap, ...((vc as { Rows: CatMap }[])[0]).Rows };
        }
        catMapRef.current = mergedCatMap;
        setVersions(manifest);
        // Affichage initial : dernière version ou base
        const initPath = realVersions.length
          ? `/data/versions/${realVersions[realVersions.length - 1].id}`
          : "/data";
        const initMap = await getSnapshot(initPath);
        setDisplayData(Array.from(initMap.values()).map((r) => ({ ...r, isNew: false })));
      } catch {
        setError("Unable to load data. Copy the .gz files into public/data/");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!versions.length || loading) return;
    const realVersions = versions.filter((v) => v.id !== "all");

    setTimeout(() => {
      setVersionLoading(true);

      if (selectedVersion === "all") {
        // "All" = snapshot de la dernière version (ou base si aucune version)
        const path = realVersions.length ? `/data/versions/${realVersions[realVersions.length - 1].id}` : "/data";
        getSnapshot(path)
          .then((map) => setDisplayData(Array.from(map.values()).map((r) => ({ ...r, isNew: false }))))
          .catch(() => setError("Failed to load latest data"))
          .finally(() => setVersionLoading(false));
        return;
      }

      // Version spécifique : charge current + previous, calcule diff
      const idx = realVersions.findIndex((v) => v.id === selectedVersion);
      const currentPath = `/data/versions/${selectedVersion}`;
      const prevPath = idx > 0 ? `/data/versions/${realVersions[idx - 1].id}` : "/data";

      Promise.all([getSnapshot(currentPath), getSnapshot(prevPath)])
        .then(([currentMap, prevMap]) => {
          setDisplayData(Array.from(currentMap.values()).map((row) => ({ ...row, isNew: !prevMap.has(row.id) })));
        })
        .catch(() => setError(`Failed to load version ${selectedVersion}`))
        .finally(() => setVersionLoading(false));
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVersion, versions.length, loading]);

  // Enrichir les données avec les traductions pour que la recherche fonctionne
  const translatedData = useMemo(() => {
    return displayData.map((row) => ({
      ...row,
      TranslatedTitle: t(row.TitleKey, row.Title),
      TranslatedDescription: t(row.DescriptionKey, row.Description),
      TranslatedCategory: t(row.CategoryKey, row.Category),
      TranslatedSubcategory: t(row.SubcategoryKey, row.Subcategory),
    }));
  }, [displayData, t]);

  const columns: ColumnDef<AchievementRow, unknown>[] = [
    { accessorKey: "isNew", header: "", enableSorting: false, size: 32, cell: (i) => i.getValue() ? <span title="New in this version"><Sparkles size={14} className="text-yellow-400" /></span> : null },
    { accessorKey: "image", header: "Icon", enableSorting: false, cell: (i) => { const src = i.getValue() as string; return src ? <Image src={src} alt="" width={48} height={48} loading="lazy" className="rounded" unoptimized /> : null; } },
    {
      accessorKey: "TranslatedTitle",
      header: "Title",
      cell: (i) => i.getValue() as string
    },
    {
      accessorKey: "TranslatedDescription",
      header: "Description",
      cell: (i) => i.getValue() as string
    },
    {
      accessorKey: "TranslatedCategory",
      header: "Category",
      cell: (i) => i.getValue() as string
    },
    {
      accessorKey: "TranslatedSubcategory",
      header: "Subcategory",
      cell: (i) => i.getValue() as string
    },
  ];

  const newCount = translatedData.filter((r) => r.isNew).length;

  // Valeurs uniques pour les filtres (depuis translatedData complet)
  // On crée une map Category -> TranslatedCategory pour l'affichage
  const categoryMap = new Map<string, string>();
  const subcategoryMap = new Map<string, string>();

  translatedData.forEach((r) => {
    if (r.Category) categoryMap.set(r.Category, r.TranslatedCategory || r.Category);
    if (r.Subcategory) subcategoryMap.set(r.Subcategory, r.TranslatedSubcategory || r.Subcategory);
  });

  const allCategories = [...new Set(translatedData.map((r) => r.Category).filter(Boolean))].sort();
  const allSubcategories = [...new Set(
    translatedData
      .filter((r) => selectedCategories.size === 0 || selectedCategories.has(r.Category))
      .map((r) => r.Subcategory).filter(Boolean)
  )].sort();

  function toggleSet(set: Set<string>, value: string): Set<string> {
    const next = new Set(set);
    if (next.has(value)) { next.delete(value); } else { next.add(value); }
    return next;
  }

  const tableData = translatedData
    .filter((r) => !showOnlyNew || r.isNew)
    .filter((r) => selectedCategories.size === 0 || selectedCategories.has(r.Category))
    .filter((r) => selectedSubcategories.size === 0 || selectedSubcategories.has(r.Subcategory));

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <Trophy size={28} style={{ color: "var(--gold)" }} />
        Achievements
      </h1>
      <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>All achievements available in Throne &amp; Liberty.</p>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Version : </span>
        <select
          value={selectedVersion}
          onChange={(e) => { setSelectedVersion(e.target.value); setShowOnlyNew(false); setSelectedCategories(new Set()); setSelectedSubcategories(new Set()); }}
          className="rounded-lg border px-3 py-1.5 text-sm"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
          }}
        >
          {versions.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
        {selectedVersion !== "all" && !versionLoading && (
          <span className="text-xs px-2 py-1 rounded-full font-medium"
            style={{ background: "var(--gold-glow)", color: "var(--gold)", border: "1px solid var(--gold)" }}>
            {translatedData.length} achievements{newCount > 0 && ` · ✨ ${newCount} new`}
          </span>
        )}
        {selectedVersion !== "all" && newCount > 0 && !versionLoading && (
          <button
            onClick={() => setShowOnlyNew((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors"
            style={{
              borderColor: showOnlyNew ? "var(--accent)" : "var(--border)",
              color: showOnlyNew ? "var(--accent-bright)" : "var(--text-secondary)",
              background: showOnlyNew ? "var(--accent-glow)" : "var(--bg-card)",
            }}
          >
            {showOnlyNew ? "Show all" : "✨ New only"}
          </button>
        )}
        {versionLoading && <span className="text-xs animate-pulse" style={{ color: "var(--text-muted)" }}>Loading…</span>}
      </div>

      {loading && <div className="py-20 text-center text-sm animate-pulse" style={{ color: "var(--text-muted)" }}>Loading data…</div>}
      {error && <div className="rounded-xl border p-4 text-sm" style={{ background: "var(--bg-card)", borderColor: "var(--red)", color: "var(--red)" }}>⚠️ {error}</div>}
      {!loading && !error && (
        <>
          {/* Filtres Category / Subcategory */}
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Categories */}
            {allCategories.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Category</span>
                <div className="flex flex-wrap gap-1.5">
                  {allCategories.map((cat) => {
                    const active = selectedCategories.has(cat);
                    return (
                      <button key={cat} onClick={() => { setSelectedCategories(toggleSet(selectedCategories, cat)); setSelectedSubcategories(new Set()); }}
                        className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                        style={{
                          borderColor: active ? "var(--accent)" : "var(--border)",
                          background: active ? "var(--accent-glow)" : "var(--bg-card)",
                          color: active ? "var(--accent-bright)" : "var(--text-secondary)",
                        }}>
                        {categoryMap.get(cat) || cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Subcategories (filtrées selon catégories sélectionnées) */}
            {allSubcategories.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Subcategory</span>
                <div className="flex flex-wrap gap-1.5">
                  {allSubcategories.map((sub) => {
                    const active = selectedSubcategories.has(sub);
                    return (
                      <button key={sub} onClick={() => setSelectedSubcategories(toggleSet(selectedSubcategories, sub))}
                        className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                        style={{
                          borderColor: active ? "var(--accent)" : "var(--border)",
                          background: active ? "var(--accent-glow)" : "var(--bg-card)",
                          color: active ? "var(--accent-bright)" : "var(--text-secondary)",
                        }}>
                        {subcategoryMap.get(sub) || sub}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Reset */}
            {(selectedCategories.size > 0 || selectedSubcategories.size > 0) && (
              <button onClick={() => { setSelectedCategories(new Set()); setSelectedSubcategories(new Set()); }}
                className="self-end text-xs px-2.5 py-1 rounded-full border transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-card)" }}>
                ✕ Reset filters
              </button>
            )}
          </div>
          <DataTable data={tableData} columns={columns} searchPlaceholder="Search an achievement…" />
        </>
      )}
    </div>
  );
}

