"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import DataTable from "@/components/ui/DataTable";
import { type ColumnDef } from "@tanstack/react-table";
import { fetchGzJson } from "@/lib/utils";

interface MasteryRow {
  Level: number;
  pointsNext: number;
  totalPoints: number;
}

export default function WeaponMasteryPage() {
  const t = useTranslations("mastery");
  const [data, setData] = useState<MasteryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: ColumnDef<MasteryRow, unknown>[] = [
    {
      accessorKey: "Level",
      header: t("cols.level"),
      cell: (i) => (
        <span className="font-bold" style={{ color: "var(--gold)" }}>
          {i.getValue() as number}
        </span>
      ),
    },
    {
      accessorKey: "pointsNext",
      header: t("cols.pointsNext"),
      cell: (i) => (i.getValue() as number).toLocaleString(),
    },
    {
      accessorKey: "totalPoints",
      header: t("cols.totalPoints"),
      cell: (i) => (
        <span style={{ color: "var(--accent-bright)" }}>
          {(i.getValue() as number).toLocaleString()}
        </span>
      ),
    },
  ];

  useEffect(() => {
    async function load() {
      try {
        const raw = await fetchGzJson("/data/TLWeaponSpecializationLevel.gz") as unknown[];
        const rows = Object.entries(
          (raw[0] as { Rows: Record<string, { point_threshold: number }> }).Rows
        );

        setData(
          rows.map(([key, val], i) => ({
            Level: Number(key),
            pointsNext: val.point_threshold - (i > 0 ? rows[i - 1][1].point_threshold : 0),
            totalPoints: val.point_threshold,
          }))
        );
      } catch {
        setError(t("error"));
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: "var(--gold-glow)", border: "1px solid var(--gold)40" }}
        >
          ⭐
        </div>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            {t("title")}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {t("subtitle")}
          </p>
        </div>
      </div>

      {loading && (
        <div className="py-20 text-center text-sm animate-pulse" style={{ color: "var(--text-muted)" }}>
          {t("loading")}
        </div>
      )}

      {error && (
        <div className="rounded-xl border p-4 text-sm" style={{ background: "var(--bg-card)", borderColor: "var(--red)", color: "var(--red)" }}>
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && (
        <DataTable data={data} columns={columns} searchPlaceholder={t("search")} />
      )}
    </div>
  );
}

