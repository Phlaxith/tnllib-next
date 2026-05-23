"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/ui/DataTable";
import { type ColumnDef } from "@tanstack/react-table";
import { Fish } from "lucide-react";
import { fetchGzJson } from "@/lib/utils";

interface FishRow { Name: string; Level: number; Habitat: string; }
interface LevelRow { Name: string; expNext: number; TotalExp: number; Title: string; }

export default function FishingPage() {
  const [fishData, setFishData] = useState<FishRow[]>([]);
  const [levelData, setLevelData] = useState<LevelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fishColumns: ColumnDef<FishRow, unknown>[] = [
    { accessorKey: "Name",    header: "Name" },
    { accessorKey: "Level",   header: "Level" },
    { accessorKey: "Habitat", header: "Habitat", cell: (i) => (
      <div style={{ whiteSpace: "pre-line", lineHeight: 1.5 }}>{i.getValue() as string}</div>
    )},
  ];

  const levelColumns: ColumnDef<LevelRow, unknown>[] = [
    { accessorKey: "Name",    header: "Tier" },
    { accessorKey: "Title",   header: "Title" },
    { accessorKey: "expNext", header: "XP required",  cell: (i) => (i.getValue() as number).toLocaleString() },
    { accessorKey: "TotalExp",header: "Total XP",     cell: (i) => (i.getValue() as number).toLocaleString() },
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
        setError("Unable to load data. Copy the .gz files into public/data/");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <Fish size={28} style={{ color: "var(--green)" }} />
        Fishing
      </h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-secondary)" }}>Fishing data extracted from the game.</p>

      {loading && <div className="py-20 text-center text-sm animate-pulse" style={{ color: "var(--text-muted)" }}>Loading data…</div>}
      {error && <div className="rounded-xl border p-4 text-sm" style={{ background: "var(--bg-card)", borderColor: "var(--red)", color: "var(--red)" }}>⚠️ {error}</div>}

      {!loading && !error && (
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Fishing Levels</h2>
            <DataTable data={levelData} columns={levelColumns} searchPlaceholder="Search a tier…" />
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Fish &amp; Habitats</h2>
            <DataTable data={fishData} columns={fishColumns} searchPlaceholder="Search a fish or habitat…" />
          </section>
        </div>
      )}
    </div>
  );
}

