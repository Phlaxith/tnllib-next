"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import DataTable from "@/components/ui/DataTable";
import { type ColumnDef } from "@tanstack/react-table";
import { Fish } from "lucide-react";
import { fetchGzJson } from "@/lib/utils";

interface FishRow { Name: string; Level: number; Habitat: string; }
interface LevelRow { Name: string; expNext: number; TotalExp: number; Title: string; }

export default function FishingPage() {
  const t = useTranslations("fishing");
  const [fishData, setFishData] = useState<FishRow[]>([]);
  const [levelData, setLevelData] = useState<LevelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fishColumns: ColumnDef<FishRow, unknown>[] = [
    { accessorKey: "Name",    header: t("cols.name") },
    { accessorKey: "Level",   header: t("cols.level") },
    { accessorKey: "Habitat", header: t("cols.habitat"), cell: (i) => (
      <div style={{ whiteSpace: "pre-line", lineHeight: 1.5 }}>{i.getValue() as string}</div>
    )},
  ];

  const levelColumns: ColumnDef<LevelRow, unknown>[] = [
    { accessorKey: "Name",    header: t("cols.tier") },
    { accessorKey: "Title",   header: t("cols.title") },
    { accessorKey: "expNext", header: t("cols.expNext"),  cell: (i) => (i.getValue() as number).toLocaleString() },
    { accessorKey: "TotalExp",header: t("cols.totalExp"), cell: (i) => (i.getValue() as number).toLocaleString() },
  ];

  useEffect(() => {
    async function load() {
      try {
        const [levelRaw, fishRaw] = await Promise.all([
          fetchGzJson("/data/TLFishingLevel.gz"),
          fetchGzJson("/data/TLFishingFishInfo.gz"),
        ]) as [unknown[], unknown[]];

        const levelRows = Object.entries((levelRaw[0] as { Rows: Record<string, { LevelExpThreshold: number; Title?: { LocalizedString: string } }> }).Rows);
        setLevelData(levelRows.map(([key, val], i) => ({
          Name: key,
          expNext: val.LevelExpThreshold - (i > 0 ? levelRows[i - 1][1].LevelExpThreshold : 0),
          TotalExp: val.LevelExpThreshold,
          Title: val.Title?.LocalizedString ?? "",
        })));

        const fishRows = Object.values((fishRaw[0] as { Rows: Record<string, { FishName?: { LocalizedString: string }; Level: number; HabitatInfo?: { HabitatList: { RowName: string }[] } }> }).Rows);
        setFishData(fishRows.map((v) => ({
          Name: v.FishName?.LocalizedString ?? "",
          Level: v.Level,
          Habitat: v.HabitatInfo?.HabitatList.map((h) => h.RowName).join("\n") ?? "",
        })));
      } catch {
        setError(t("error"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t]);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <Fish size={28} style={{ color: "var(--green)" }} />
        {t("title")}
      </h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-secondary)" }}>{t("subtitle")}</p>

      {loading && <div className="py-20 text-center text-sm animate-pulse" style={{ color: "var(--text-muted)" }}>{t("loading")}</div>}
      {error && <div className="rounded-xl border p-4 text-sm" style={{ background: "var(--bg-card)", borderColor: "var(--red)", color: "var(--red)" }}>⚠️ {error}</div>}

      {!loading && !error && (
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t("levelsTitle")}</h2>
            <DataTable data={levelData} columns={levelColumns} searchPlaceholder={t("searchLevels")} />
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t("fishTitle")}</h2>
            <DataTable data={fishData} columns={fishColumns} searchPlaceholder={t("searchFish")} />
          </section>
        </div>
      )}
    </div>
  );
}

