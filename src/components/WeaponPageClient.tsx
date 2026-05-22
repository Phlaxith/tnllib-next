"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import DataTable from "@/components/ui/DataTable";
import { type ColumnDef } from "@tanstack/react-table";
import { fetchGzJson, unrealPathToPublic } from "@/lib/utils";

// Mapping slug → nom de fichier GZ
const WEAPON_FILES: Record<string, string> = {
  bow:      "TLSkillPcLooks_Weapon_Bow",
  crossbow: "TLSkillPcLooks_Weapon_Crossbow",
  dagger:   "TLSkillPcLooks_Weapon_Dagger",
  gauntlet: "TLSkillPcLooks_Weapon_Gauntlet",
  orb:      "TLSkillPcLooks_Weapon_Orb",
  spear:    "TLSkillPcLooks_Weapon_Spear",
  staff:    "TLSkillPcLooks_Weapon_Staff",
  sword:    "TLSkillPcLooks_Weapon_Sword",
  sword2h:  "TLSkillPcLooks_Weapon_Sword2h",
  wand:     "TLSkillPcLooks_Weapon_Wand",
};

interface SkillRow {
  icon: string;
  name: string;
  internal: string;
  type: string;
  delay: number | string;
  hitDelay: number | string;
  chargeDelay: number | string;
  mp: string | number;
  hp: string | number;
  cooldown: string | number;
}

interface WeaponPageClientProps {
  weapon: string;
}

export default function WeaponPageClient({ weapon }: WeaponPageClientProps) {
  const t = useTranslations("weapons");
  const [data, setData] = useState<SkillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weaponFile = WEAPON_FILES[weapon];
  const weaponName = t(`names.${weapon}` as Parameters<typeof t>[0], { defaultValue: weapon });

  const columns: ColumnDef<SkillRow, unknown>[] = useMemo(() => [
    {
      accessorKey: "icon",
      header: t("cols.icon"),
      enableSorting: false,
      cell: (i) => {
        const src = i.getValue() as string;
        return src
          ? <img src={src} alt="" width={40} height={40} loading="lazy" className="rounded" style={{ imageRendering: "pixelated" }} />
          : <div className="w-10 h-10 rounded" style={{ background: "var(--border)" }} />;
      },
    },
    { accessorKey: "name",        header: t("cols.name") },
    { accessorKey: "internal",    header: t("cols.internal"), cell: (i) => <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{i.getValue() as string}</span> },
    { accessorKey: "type",        header: t("cols.type"),     cell: (i) => {
      const v = i.getValue() as string;
      return v ? <span className="px-2 py-0.5 rounded text-xs" style={{ background: "var(--accent-glow)", color: "var(--accent-bright)" }}>{v}</span> : null;
    }},
    { accessorKey: "delay",       header: t("cols.delay") },
    { accessorKey: "hitDelay",    header: t("cols.hitDelay") },
    { accessorKey: "chargeDelay", header: t("cols.chargeDelay") },
    { accessorKey: "mp",          header: t("cols.mp") },
    { accessorKey: "hp",          header: t("cols.hp") },
    { accessorKey: "cooldown",    header: t("cols.cooldown") },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [weapon]);

  useEffect(() => {
    if (!weaponFile) {
      setError(`Unknown weapon: ${weapon}`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setData([]);

    async function load() {
      try {
        const [formulaRaw, optionalRaw, looksRaw, skillRaw] = await Promise.all([
          fetchGzJson("/data/TLFormulaParameterNew.gz"),
          fetchGzJson("/data/TLSkillOptionalDataForPc.gz"),
          fetchGzJson(`/data/${weaponFile}.gz`),
          fetchGzJson("/data/TLSkill.gz"),
        ]) as [unknown, unknown, unknown, unknown];

        type FormulaRows = Record<string, { FormulaParameter?: { tooltip1?: string | number }[] }>;
        type OptionalRows = Record<string, Record<string, string>>;
        type LooksRows = Record<string, { UIName?: { LocalizedString: string }; IconPath?: { AssetPathName: string } }>;
        type SkillRows = Record<string, { damage_type?: string; skill_delay?: number; hit_delay?: number; max_charge_delay?: number }>;

        const formulaRows: FormulaRows = (formulaRaw as { Rows: FormulaRows }[])[0].Rows;
        const optionalRows: OptionalRows = (optionalRaw as { Rows: OptionalRows }[])[0].Rows;
        const looksRows: LooksRows = (looksRaw as { Rows: LooksRows }[])[0].Rows;
        const skillRows: SkillRows = (skillRaw as { Rows: SkillRows }[])[0].Rows;

        const getTooltip = (optional: Record<string, string>, paramKey: string): string | number => {
          const formulaId = optional[paramKey];
          const fp = formulaRows[formulaId]?.FormulaParameter ?? [];
          return fp[0]?.tooltip1 ?? "—";
        };

        const rows: SkillRow[] = [];
        for (const [key, value] of Object.entries(looksRows)) {
          if (!(key in optionalRows)) continue;
          const optional = optionalRows[key] ?? {};
          const skill = skillRows[key] ?? {};

          // Unreal: /Game/Image/Skill/Active/M_WP_BOW_Normal_ATK.M_WP_BOW_Normal_ATK
          // Local:  /Image/Skill/Active/M_WP_BOW_Normal_ATK.png  (servi depuis public/)
          const iconUrl = unrealPathToPublic(value.IconPath?.AssetPathName);

          rows.push({
            icon:        iconUrl,
            name:        value.UIName?.LocalizedString ?? key,
            internal:    key,
            type:        skill.damage_type?.split("::k")[1] ?? "—",
            delay:       skill.skill_delay ?? "—",
            hitDelay:    skill.hit_delay ?? "—",
            chargeDelay: skill.max_charge_delay ?? "—",
            mp:          getTooltip(optional, "cost_consumption"),
            hp:          getTooltip(optional, "hp_consumption"),
            cooldown:    getTooltip(optional, "cooldown_time"),
          });
        }

        setData(rows);
      } catch (e) {
        console.error(e);
        setError(t("error"));
      } finally {
        setLoading(false);
      }
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weapon, weaponFile]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
          style={{ background: "var(--accent-glow)", border: "1px solid var(--border-bright)" }}
        >
          {WEAPON_ICON[weapon]
            ? <img src={WEAPON_ICON[weapon]} alt={weapon} width={36} height={36} style={{ objectFit: "contain" }} />
            : "⚔️"
          }
        </div>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            {weaponName}
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
        <>
          <div className="mb-3 text-sm" style={{ color: "var(--text-muted)" }}>
            {data.length} compétences
          </div>
          <DataTable data={data} columns={columns} searchPlaceholder={t("search")} />
        </>
      )}
    </div>
  );
}

const WEAPON_ICON: Record<string, string> = {
  bow:      "/Image/Weapon/Bow.png",
  crossbow: "/Image/Weapon/CrossBow.png",
  dagger:   "/Image/Weapon/Dagger.png",
  gauntlet: "/Image/Weapon/Gauntlet.png",
  orb:      "/Image/Weapon/Orb.png",
  spear:    "/Image/Weapon/Spear.png",
  staff:    "/Image/Weapon/Staff.png",
  sword:    "/Image/Weapon/Sword.png",
  sword2h:  "/Image/Weapon/Sword2h.png",
  wand:     "/Image/Weapon/Hand.png",
};






