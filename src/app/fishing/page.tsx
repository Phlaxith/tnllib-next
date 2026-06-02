"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import DataTable from "@/components/ui/DataTable";
import { type ColumnDef } from "@tanstack/react-table";
import { Fish, Sparkles } from "lucide-react";
import { fetchGzJson, unrealPathToPublic } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import Image from "next/image";

interface FishRow {
  id: string;
  Icon: string;
  Name: string;
  NameKey: string; // Key for translation
  Level: number;
  Habitat: string;
  HabitatKeys: string[]; // Keys for region translations
  isNew?: boolean;
  // Champs traduits
  TranslatedName?: string;
  TranslatedHabitat?: string;
}
interface VersionEntry { id: string; label: string; }

const BASE_PATH = "/data";

async function fetchWithFallback(basePath: string, file: string): Promise<unknown[]> {
  try {
    return await fetchGzJson(`${basePath}/${file}`) as unknown[];
  } catch {
    return await fetchGzJson(`${BASE_PATH}/${file}`) as unknown[];
  }
}

async function loadSnapshot(basePath: string): Promise<Map<string, FishRow>> {
  const [fishRaw, regionRaw] = await Promise.all([
    fetchWithFallback(basePath, "TLFishingFishInfo.gz"),
    fetchWithFallback(basePath, "TLRegionGroup.gz"),
  ]);

  const regionMap: Record<string, { name: string; key: string }> = {};
  const regionRows = (regionRaw[0] as { Rows: Record<string, {
    UIName?: { LocalizedString: string; Key: string }
  }> }).Rows;

  for (const [key, val] of Object.entries(regionRows)) {
    regionMap[key] = {
      name: val.UIName?.LocalizedString ?? key,
      key: val.UIName?.Key ?? "",
    };
  }

  const fishRows = (fishRaw[0] as { Rows: Record<string, {
    RegistIconPath?: { AssetPathName: string };
    FishName?: { LocalizedString: string; Key: string };
    Level: number;
    HabitatInfo?: { HabitatList: { RowName: string }[] };
  }> }).Rows;

  const map = new Map<string, FishRow>();
  for (const [rowId, v] of Object.entries(fishRows)) {
    const habitatList = v.HabitatInfo?.HabitatList ?? [];
    const habitatNames = habitatList.map((h) => regionMap[h.RowName]?.name ?? h.RowName);
    const habitatKeys = habitatList.map((h) => regionMap[h.RowName]?.key ?? "");

    map.set(rowId, {
      id: rowId,
      Icon: unrealPathToPublic(v.RegistIconPath?.AssetPathName),
      Name: v.FishName?.LocalizedString ?? "",
      NameKey: v.FishName?.Key ?? "",
      Level: v.Level,
      Habitat: habitatNames.join("\n"),
      HabitatKeys: habitatKeys,
    });
  }
  return map;
}

export default function FishingPage() {
  const { t: tFish } = useTranslation("TLStringContents");
  const { t: tRegion } = useTranslation("TLRegionGroup");
  const [displayData, setDisplayData] = useState<FishRow[]>([]);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [versionLoading, setVersionLoading] = useState(false);
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snapshotCache = useRef<Map<string, Map<string, FishRow>>>(new Map());

  async function getSnapshot(path: string): Promise<Map<string, FishRow>> {
    if (snapshotCache.current.has(path)) return snapshotCache.current.get(path)!;
    const map = await loadSnapshot(path);
    snapshotCache.current.set(path, map);
    return map;
  }

  useEffect(() => {
    async function load() {
      try {
        const manifest = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/versions/manifest.json`).then((r) => r.json()) as VersionEntry[];
        const realVersions = manifest.filter((v) => v.id !== "all");
        setVersions(manifest);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!versions.length || loading) return;
    const realVersions = versions.filter((v) => v.id !== "all");

    setTimeout(() => {
      setVersionLoading(true);

      if (selectedVersion === "all") {
        const path = realVersions.length ? `/data/versions/${realVersions[realVersions.length - 1].id}` : "/data";
        getSnapshot(path)
          .then((map) => setDisplayData(Array.from(map.values()).map((r) => ({ ...r, isNew: false }))))
          .catch(() => setError("Failed to load latest data"))
          .finally(() => setVersionLoading(false));
        return;
      }

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

  const translatedData = useMemo(() => {
    return displayData.map((row) => {
      // Translate each habitat
      const translatedHabitats = row.HabitatKeys
        .map((key, index) => {
          if (!key) return row.Habitat.split("\n")[index] || "";
          return tRegion(key, row.Habitat.split("\n")[index] || "");
        })
        .filter(Boolean);

      return {
        ...row,
        TranslatedName: tFish(row.NameKey, row.Name),
        TranslatedHabitat: translatedHabitats.join("\n"),
      };
    });
  }, [displayData, tFish, tRegion]);

  const fishColumns: ColumnDef<FishRow, unknown>[] = [
    { accessorKey: "isNew", header: "", enableSorting: false, size: 32,
      cell: (i) => i.getValue() ? <span title="New in this version"><Sparkles size={14} className="text-yellow-400" /></span> : null,
    },
    { accessorKey: "Icon", header: "Icon", enableSorting: false,
      cell: (i) => {
        const src = i.getValue() as string;
        return src
          ? <Image src={src} alt="" width={40} height={40} className="rounded" style={{ imageRendering: "pixelated" }} unoptimized />
          : <div className="w-10 h-10 rounded" style={{ background: "var(--border)" }} />;
      },
    },
    {
      accessorKey: "TranslatedName",
      header: "Name",
      cell: (i) => i.getValue() as string
    },
    { accessorKey: "Level",   header: "Level" },
    {
      accessorKey: "TranslatedHabitat",
      header: "Habitat",
      cell: (i) => (
        <div style={{ whiteSpace: "pre-line", lineHeight: 1.5 }}>{i.getValue() as string}</div>
      )
    },
  ];

  const newCount = translatedData.filter((r) => r.isNew).length;
  const tableData = translatedData.filter((r) => !showOnlyNew || r.isNew);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <Fish size={28} style={{ color: "var(--green)" }} />
        Fishing
      </h1>
      <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>Fishing data extracted from the game.</p>

      {/* Version selector */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Version :</span>
        <select
          value={selectedVersion}
          onChange={(e) => { setSelectedVersion(e.target.value); setShowOnlyNew(false); }}
          className="rounded-lg border px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--bg-card)", color: "var(--text-primary)" }}
        >
          {versions.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
        {selectedVersion !== "all" && !versionLoading && (
          <span className="text-xs px-2 py-1 rounded-full font-medium"
            style={{ background: "var(--green-glow, var(--accent-glow))", color: "var(--green)", border: "1px solid var(--green)" }}>
            {translatedData.length} fish{newCount > 0 && ` · ✨ ${newCount} new`}
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
        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Fish &amp; Habitats</h2>
          <DataTable data={tableData} columns={fishColumns} searchPlaceholder="Search a fish or habitat…" />
        </section>
      )}
    </div>
  );
}

