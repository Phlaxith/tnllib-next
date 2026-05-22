"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import DataTable from "@/components/ui/DataTable";
import { type ColumnDef } from "@tanstack/react-table";
import { Trophy } from "lucide-react";
import { fetchGzJson, unrealPathToPublic } from "@/lib/utils";

interface AchievementRow { image: string; Title: string; Description: string; Category: string; Subcategory: string; }

const FILES = ["TLAchievementLooks_Combat","TLAchievementLooks_Economy","TLAchievementLooks_Live","TLAchievementLooks_Narrative","TLAchievementLooks_World1","TLAchievementLooks_World2","TLAchievementLooks_World3"];

export default function AchievementsPage() {
  const t = useTranslations("achievements");
  const [data, setData] = useState<AchievementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: ColumnDef<AchievementRow, unknown>[] = [
    {
      accessorKey: "image", header: t("cols.icon"), enableSorting: false,
      cell: (i) => { const src = i.getValue() as string; return src ? <Image src={src} alt="" width={48} height={48} loading="lazy" className="rounded" unoptimized /> : null; },
    },
    { accessorKey: "Title",       header: t("cols.title") },
    { accessorKey: "Description", header: t("cols.description") },
    { accessorKey: "Category",    header: t("cols.category") },
    { accessorKey: "Subcategory", header: t("cols.subcategory") },
  ];

  useEffect(() => {
    async function load() {
      try {
        const [catRaw, ...achievRaw] = await Promise.all([
          fetchGzJson("/data/TLAchievementCategory.gz"),
          ...FILES.map((f) => fetchGzJson(`/data/${f}.gz`)),
        ]) as [unknown, ...unknown[]];

        const categoryByRow = ((catRaw as { Rows: Record<string, { ParentCategory?: { RowName: string }; DisplayText?: { LocalizedString: string } }> }[])[0]).Rows;
        const list: AchievementRow[] = [];

        for (const fileData of achievRaw) {
          const rows = Object.values(((fileData as { Rows: Record<string, unknown> }[])[0]).Rows) as { IconImage?: { AssetPathName: string }; TitleText?: { LocalizedString: string }; Description?: { LocalizedString: string }; Category?: { RowName: string } }[];
          for (const v of rows) {
            const catRow = v.Category?.RowName ? categoryByRow[v.Category.RowName] : undefined;
            if (!catRow) continue;
            list.push({ image: unrealPathToPublic(v.IconImage?.AssetPathName), Title: v.TitleText?.LocalizedString ?? "", Description: v.Description?.LocalizedString ?? "", Category: catRow.ParentCategory?.RowName ?? "", Subcategory: catRow.DisplayText?.LocalizedString ?? "" });
          }
        }
        setData(list);
      } catch {
        setError(t("error"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t]);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <Trophy size={28} style={{ color: "var(--gold)" }} />
        {t("title")}
      </h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-secondary)" }}>{t("subtitle")}</p>

      {loading && <div className="py-20 text-center text-sm animate-pulse" style={{ color: "var(--text-muted)" }}>{t("loading")}</div>}
      {error && <div className="rounded-xl border p-4 text-sm" style={{ background: "var(--bg-card)", borderColor: "var(--red)", color: "var(--red)" }}>⚠️ {error}</div>}
      {!loading && !error && <DataTable data={data} columns={columns} searchPlaceholder={t("search")} />}
    </div>
  );
}

