"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel, SortingState, useReactTable
} from "@tanstack/react-table";
import { fetchGzJson, unrealPathToPublic, prefixPath } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

// Mapping slug → GZ filename
const WEAPON_FILES: Record<string, string> = {
  bow: "TLSkillPcLooks_Weapon_Bow",
  crossbow: "TLSkillPcLooks_Weapon_Crossbow",
  dagger: "TLSkillPcLooks_Weapon_Dagger",
  gauntlet: "TLSkillPcLooks_Weapon_Gauntlet",
  orb: "TLSkillPcLooks_Weapon_Orb",
  spear: "TLSkillPcLooks_Weapon_Spear",
  staff: "TLSkillPcLooks_Weapon_Staff",
  sword: "TLSkillPcLooks_Weapon_Sword",
  sword2h: "TLSkillPcLooks_Weapon_Sword2h",
  wand: "TLSkillPcLooks_Weapon_Wand",
};

const WEAPON_ICON: Record<string, string> = {
  bow: "/Image/Weapon/Bow.png",
  crossbow: "/Image/Weapon/CrossBow.png",
  dagger: "/Image/Weapon/Dagger.png",
  gauntlet: "/Image/Weapon/Gauntlet.png",
  orb: "/Image/Weapon/Orb.png",
  spear: "/Image/Weapon/Spear.png",
  staff: "/Image/Weapon/Staff.png",
  sword: "/Image/Weapon/Sword.png",
  sword2h: "/Image/Weapon/Sword2h.png",
  wand: "/Image/Weapon/Hand.png",
};

const WEAPON_NAMES: Record<string, string> = {
  bow: "Bow",
  crossbow: "Crossbow",
  dagger: "Dagger",
  gauntlet: "Gauntlet",
  orb: "Orb",
  spear: "Spear",
  staff: "Staff",
  sword: "Sword & Shield",
  sword2h: "Greatsword",
  wand: "Wand",
};

interface SkillRank {
  level: number;
  description: string;
  descriptionKey: string;
}

interface SkillRow {
  icon: string;
  name: string;
  nameKey: string;
  description: string;
  descriptionKey: string;
  internal: string;
  type: string;
  typeKey: string;
  category: "active" | "passive" | "defense" | "specialization" | "mastery";
  delay: number | string;
  hitDelay: number | string;
  chargeDelay: number | string;
  mp: string | number;
  hp: string | number;
  cooldown: string | number;
  ranks: SkillRank[];
  TranslatedName?: string;
  TranslatedType?: string;
  TranslatedCategory?: string;
}

interface WeaponPageClientProps {
  weapon: string;
}

export default function WeaponPageClient({ weapon }: WeaponPageClientProps) {
  const { t: tSkill } = useTranslation("TLStringSkillDesc");
  const [data, setData] = useState<SkillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weaponFile = WEAPON_FILES[weapon];
  const weaponName = WEAPON_NAMES[weapon] ?? weapon;

  useEffect(() => {
    if (!weaponFile) return;

    async function load() {
      setLoading(true);
      setError(null);
      setData([]);
      try {
        const [formulaRaw, optionalRaw, looksRaw, skillRaw] = await Promise.all([
          fetchGzJson("/data/TLFormulaParameterNew.gz"),
          fetchGzJson("/data/TLSkillOptionalDataForPc.gz"),
          fetchGzJson(`/data/${weaponFile}.gz`),
          fetchGzJson("/data/TLSkill.gz"),
        ]) as [unknown, unknown, unknown, unknown];

        type FormulaRows = Record<string, { FormulaParameter?: { tooltip1?: string | number }[] }>;
        type OptionalRows = Record<string, Record<string, string>>;
        type LooksRows = Record<
            string,
            {
              RankDescription?: Array<{
                Key: string;
                Value?: { LocalizedString: string; Key: string; TableId: string; SourceString: string };
              }>;
              UIName?: { LocalizedString: string; Key: string };
              IconPath?: { AssetPathName: string };
            }
        >;
        type SkillRows = Record<
            string,
            {
              damage_type?: string;
              skill_delay?: number;
              hit_delay?: number;
              max_charge_delay?: number;
            }
        >;

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
        const seenNames = new Set<string>(); // Pour éviter les doublons de nom

        // Parcourir tous les skills
        for (const [key, value] of Object.entries(looksRows)) {
          if (!(key in optionalRows)) continue;

          const optional = optionalRows[key] ?? {};
          const skill = skillRows[key] ?? {};

          const iconPath = value.IconPath?.AssetPathName ?? "";
          const iconUrl = unrealPathToPublic(iconPath);
          const damageType = skill.damage_type?.split("::k")[1] ?? "—";

          // Déterminer la catégorie basée sur la clé de traduction
          const nameKey = value.UIName?.Key ?? "";
          let category: "defense" | "active" | "passive" | "specialization" | "mastery" = "active";

          if (nameKey.startsWith("CM_") || nameKey.includes("CounterMove")) {
            category = "defense";
          }
          if (nameKey.startsWith("TEXT_RES_SKILL_NAME")) {
            if (nameKey.includes("_trait")) {
              category = "specialization";
            } else {
              category = "active";
            }
          } else if (nameKey.startsWith("TEXT_NAME_WM")) {
            category = "mastery";
          } else if (iconPath.includes("/Passive/") || iconPath.includes("/Specialization/")) {
            category = "passive";
          }

          // Utiliser le nom traduit comme clé unique pour éviter les doublons
          const skillName = value.UIName?.LocalizedString ?? key;

          // Si ce skill existe déjà avec ce nom, on le saute (doublon)
          if (seenNames.has(skillName)) continue;
          seenNames.add(skillName);

          const ranks: SkillRank[] = (value.RankDescription ?? []).map((rank, index) => ({
            level: index + 1,
            description: rank.Value?.LocalizedString ?? "",
            descriptionKey: rank.Value?.Key ?? "",
          }));

          rows.push({
            icon: iconUrl,
            name: value.UIName?.LocalizedString ?? key,
            nameKey: value.UIName?.Key ?? "",
            description: value.RankDescription?.[0]?.Value?.LocalizedString ?? key,
            descriptionKey: value.RankDescription?.[0]?.Value?.Key ?? "",
            internal: key,
            type: damageType,
            typeKey: skill.damage_type ?? "",
            category,
            delay: skill.skill_delay ?? "—",
            hitDelay: skill.hit_delay ?? "—",
            chargeDelay: skill.max_charge_delay ?? "—",
            mp: getTooltip(optional, "cost_consumption"),
            hp: getTooltip(optional, "hp_consumption"),
            cooldown: getTooltip(optional, "cooldown_time"),
            ranks,
          });
        }

        setData(rows);
      } catch (e) {
        console.error(e);
        setError("Unable to load data. Missing file in public/data/");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [weapon, weaponFile]);

  const translatedData = useMemo(() => {
    return data.map((row) => ({
      ...row,
      TranslatedName: tSkill(row.nameKey, row.name),
      TranslatedType: row.type,
      TranslatedDescription: tSkill(row.descriptionKey, row.description),
      TranslatedCategory: row.category === "active" ? "Active" :
                         row.category === "passive" ? "Passive" :
                             row.category === "defense" ? "Defense" :
                         row.category === "specialization" ? "Specialization" : "Mastery",
    }));
  }, [data, tSkill]);

  // Stats pour affichage
  const defenseCount = useMemo(
      () => translatedData.filter((s) => s.category === "defense").length,
      [translatedData]
  );
  const activeCount = useMemo(
      () => translatedData.filter((s) => s.category === "active").length,
      [translatedData]
  );
  const passiveCount = useMemo(
      () => translatedData.filter((s) => s.category === "passive").length,
      [translatedData]
  );
  const specializationCount = useMemo(
      () => translatedData.filter((s) => s.category === "specialization").length,
      [translatedData]
  );
  const masteryCount = useMemo(
      () => translatedData.filter((s) => s.category === "mastery").length,
      [translatedData]
  );

  const columns: ColumnDef<SkillRow & { TranslatedCategory?: string }, unknown>[] = useMemo(
      () => [
        {
          accessorKey: "icon",
          header: "",
          enableSorting: false,
          cell: (i) => {
            const src = i.getValue() as string;
            return src ? (
                <Image
                    src={src}
                    alt=""
                    width={40}
                    height={40}
                    className="rounded"
                    style={{ imageRendering: "pixelated" }}
                    unoptimized
                />
            ) : (
                <div className="w-10 h-10 rounded" style={{ background: "var(--border)" }} />
            );
          },
        },
        {
          accessorKey: "TranslatedName",
          header: "Name",
          cell: (i) => (
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {i.getValue() as string}
          </span>
          ),
        },
        {
          accessorKey: "TranslatedCategory",
          header: "Type",
          cell: (i) => {
            const v = i.getValue() as string;
            let bgColor = "var(--bg-secondary)";
            let textColor = "var(--text-secondary)";

            if (v === "Active") {
              bgColor = "var(--accent-glow)";
              textColor = "var(--accent-bright)";
            }else if (v === "Defense") {
              bgColor = "rgb(249, 115, 22)"; // orange
              textColor = "white";
            }
            else if (v === "Specialization") {
              bgColor = "rgb(147, 51, 234)"; // purple
              textColor = "white";
            } else if (v === "Mastery") {
              bgColor = "rgb(234, 179, 8)"; // yellow
              textColor = "white";
            }

            return (
                <span
                    className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{
                      background: bgColor,
                      color: textColor,
                    }}
                >
              {v}
            </span>
            );
          },
        },
      ],
      []
  );

  if (!weaponFile) {
    return (
        <div
            className="rounded-xl border p-4 text-sm"
            style={{ background: "var(--bg-card)", borderColor: "var(--red)", color: "var(--red)" }}
        >
          ⚠️ Unknown weapon: {weapon}
        </div>
    );
  }

  return (
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div
              className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ background: "var(--accent-glow)", border: "1px solid var(--border-bright)" }}
          >
            {WEAPON_ICON[weapon] ? (
                <Image
                    src={prefixPath(WEAPON_ICON[weapon])}
                    alt={weapon}
                    width={36}
                    height={36}
                    style={{ objectFit: "contain" }}
                    unoptimized
                />
            ) : (
                "⚔️"
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              {weaponName}
            </h1>
          </div>
        </div>

        {loading && (
            <div className="py-20 text-center text-sm animate-pulse" style={{ color: "var(--text-muted)" }}>
              Loading data…
            </div>
        )}

        {error && (
            <div
                className="rounded-xl border p-4 text-sm"
                style={{ background: "var(--bg-card)", borderColor: "var(--red)", color: "var(--red)" }}
            >
              ⚠️ {error}
            </div>
        )}

        {!loading && !error && (
            <>
              {/* Stats */}
              <div className="mb-6 flex gap-6 text-sm flex-wrap">
                <div>
                  <span style={{ color: "var(--text-muted)" }}>⚔️ Active Skills:</span>{" "}
                  <span className="font-semibold" style={{ color: "var(--accent-bright)" }}>{activeCount}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>🛡️ Passive Skills:</span>{" "}
                  <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>{passiveCount}</span>
                </div>
                {defenseCount > 0 && (
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>🔰 Defense:</span>{" "}
                    <span className="font-semibold" style={{ color: "rgb(249, 115, 22)" }}>{defenseCount}</span>
                  </div>
                )}
                {specializationCount > 0 && (
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>🔮 Specialization:</span>{" "}
                    <span className="font-semibold" style={{ color: "rgb(147, 51, 234)" }}>{specializationCount}</span>
                  </div>
                )}
                {masteryCount > 0 && (
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>⭐ Mastery:</span>{" "}
                    <span className="font-semibold" style={{ color: "rgb(234, 179, 8)" }}>{masteryCount}</span>
                  </div>
                )}
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Total:</span>{" "}
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{translatedData.length}</span>
                </div>
              </div>

              {/* Tableau avec tooltip au hover */}
              <DataTableWithTooltip
                  data={translatedData}
                  columns={columns}
                  searchPlaceholder="Search a skill…"
                  tSkill={tSkill}
              />
            </>
        )}
      </div>
  );
}

// Tableau avec tooltip hover ET modal click
function DataTableWithTooltip<T extends SkillRow>({
  data,
  columns,
  searchPlaceholder,
  tSkill,
}: {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  searchPlaceholder?: string;
  tSkill: (key: string, fallback: string) => string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<T | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Filtrer les données par catégorie
  const filteredData = useMemo(() => {
    if (!categoryFilter) return data;
    return data.filter((row) => row.category === categoryFilter);
  }, [data, categoryFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
      <div className="flex flex-col gap-3">
        {/* Category Filters */}
        <div className="flex gap-2 flex-wrap">
          <button
              onClick={() => setCategoryFilter(null)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: !categoryFilter ? "var(--accent-glow)" : "var(--bg-secondary)",
                color: !categoryFilter ? "var(--accent-bright)" : "var(--text-secondary)",
                border: `1px solid ${!categoryFilter ? "var(--border-bright)" : "var(--border)"}`,
              }}
          >
            All
          </button>
          <button
              onClick={() => setCategoryFilter("active")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: categoryFilter === "active" ? "rgb(59, 130, 246)" : "var(--bg-secondary)",
                color: categoryFilter === "active" ? "white" : "var(--text-secondary)",
                border: `1px solid ${categoryFilter === "active" ? "rgb(96, 165, 250)" : "var(--border)"}`,
              }}
          >
            Active
          </button>
          <button
              onClick={() => setCategoryFilter("passive")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: categoryFilter === "passive" ? "rgb(100, 116, 139)" : "var(--bg-secondary)",
                color: categoryFilter === "passive" ? "white" : "var(--text-secondary)",
                border: `1px solid ${categoryFilter === "passive" ? "rgb(148, 163, 184)" : "var(--border)"}`,
              }}
          >
            Passive
          </button>
          <button
              onClick={() => setCategoryFilter("defense")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: categoryFilter === "defense" ? "rgb(249, 115, 22)" : "var(--bg-secondary)",
                color: categoryFilter === "defense" ? "white" : "var(--text-secondary)",
                border: `1px solid ${categoryFilter === "defense" ? "rgb(251, 146, 60)" : "var(--border)"}`,
              }}
          >
            Defense
          </button>
          <button
              onClick={() => setCategoryFilter("specialization")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: categoryFilter === "specialization" ? "rgb(147, 51, 234)" : "var(--bg-secondary)",
                color: categoryFilter === "specialization" ? "white" : "var(--text-secondary)",
                border: `1px solid ${categoryFilter === "specialization" ? "rgb(168, 85, 247)" : "var(--border)"}`,
              }}
          >
            Specialization
          </button>
          <button
              onClick={() => setCategoryFilter("mastery")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: categoryFilter === "mastery" ? "rgb(234, 179, 8)" : "var(--bg-secondary)",
                color: categoryFilter === "mastery" ? "white" : "var(--text-secondary)",
                border: `1px solid ${categoryFilter === "mastery" ? "rgb(250, 204, 21)" : "var(--border)"}`,
              }}
          >
            Mastery
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
              type="text"
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm border outline-none focus:ring-1"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
          />
        </div>

        <div className="text-xs flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
          <span>{table.getFilteredRowModel().rows.length} results</span>
          {categoryFilter && (
            <span>
              • Filtered by:{" "}
              <span className="font-semibold" style={{
                color: categoryFilter === "active" ? "rgb(59, 130, 246)" :
                       categoryFilter === "defense" ? "rgb(249, 115, 22)" :
                       categoryFilter === "specialization" ? "rgb(147, 51, 234)" :
                       categoryFilter === "mastery" ? "rgb(234, 179, 8)" : "var(--text-secondary)"
              }}>
                {categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}
              </span>
            </span>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-auto" style={{ borderColor: "var(--border)" }}>
          <table className="w-full">
            <thead>
            {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                      <th
                          key={header.id}
                          className="text-left px-4 py-3 text-sm font-semibold"
                          style={{
                            background: "var(--bg-secondary)",
                            color: "var(--text-secondary)",
                            borderBottom: "1px solid var(--border)",
                          }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                  ))}
                </tr>
            ))}
            </thead>
            <tbody>
            {table.getRowModel().rows.map((row) => (
                <tr
                    key={row.id}
                    onClick={() => setSelectedSkill(row.original)}
                    className="transition-colors cursor-pointer"
                    style={{
                      borderBottom: "1px solid var(--border)",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-secondary)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                  ))}
                </tr>
            ))}
            </tbody>
          </table>
          {table.getRowModel().rows.length === 0 && (
              <div className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                No result
              </div>
          )}
        </div>

        {/* Modal complet au click */}
        {selectedSkill && (
            <SkillModal
                skill={selectedSkill}
                onClose={() => setSelectedSkill(null)}
                tSkill={tSkill}
            />
        )}
      </div>
  );
}

// Modal centré pour les détails du skill
function SkillModal({
  skill,
  onClose,
  tSkill,
}: {
  skill: SkillRow;
  onClose: () => void;
  tSkill: (key: string, fallback: string) => string;
}) {
  const [selectedRank, setSelectedRank] = useState(1);
  const currentRank = skill.ranks[selectedRank - 1];
  const translatedDesc = currentRank ? tSkill(currentRank.descriptionKey, currentRank.description) : "";

  // Bloquer le scroll du body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '0px'; // Pour éviter le jump

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  // Vérifier qu'on est côté client
  if (typeof window === 'undefined') return null;

  return createPortal(
      <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{
            background: "rgba(0, 0, 0, 0.75)",
            zIndex: 99999,
          }}
          onClick={onClose}
      >
        <div
            className="rounded-xl border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{
              background: "linear-gradient(135deg, rgb(30, 41, 59) 0%, rgb(15, 23, 42) 100%)",
              borderColor: "rgb(71, 85, 105)",
            }}
            onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header with icon and close button */}
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0">
                {skill.icon && (
                    <Image
                        src={skill.icon}
                        alt={skill.TranslatedName || skill.name}
                        width={64}
                        height={64}
                        className="rounded"
                        style={{ imageRendering: "pixelated" }}
                        unoptimized
                    />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-2xl leading-tight mb-2">
                  {skill.TranslatedName || skill.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded font-semibold" style={{
                    background: skill.category === "active" ? "rgb(59, 130, 246)" :
                               skill.category === "defense" ? "rgb(249, 115, 22)" :
                               skill.category === "specialization" ? "rgb(147, 51, 234)" :
                               skill.category === "mastery" ? "rgb(234, 179, 8)" : "rgb(100, 116, 139)",
                    color: "white"
                  }}>
                    {skill.category === "active" ? "Active" :
                     skill.category === "passive" ? "Passive" :
                     skill.category === "defense" ? "Defense" :
                     skill.category === "specialization" ? "Specialization" : "Mastery"}
                  </span>
                </div>
              </div>
              <button
                  onClick={onClose}
                  className="text-3xl text-slate-400 hover:text-white transition-colors leading-none"
              >
                ×
              </button>
            </div>

            {/* Skill Type */}
            <div className="mb-4 pb-4 border-b" style={{ borderColor: "rgb(71, 85, 105)" }}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-slate-400 text-xs mb-1">Skill Type</div>
                  <div className="text-slate-200 font-semibold">{skill.type !== "—" ? skill.type : "recovery"}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs mb-1">Use Format</div>
                  <div className="text-slate-200 font-semibold">{skill.category}</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-4 pb-4 border-b" style={{ borderColor: "rgb(71, 85, 105)" }}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {skill.cooldown !== "—" && (
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Cooldown</div>
                      <div className="text-white font-semibold">{skill.cooldown}s</div>
                    </div>
                )}
                {skill.mp !== "—" && (
                    <div>
                      <div className="text-slate-400 text-xs mb-1">MP Cost</div>
                      <div className="text-white font-semibold">{skill.mp}</div>
                    </div>
                )}
                {skill.hp !== "—" && (
                    <div>
                      <div className="text-slate-400 text-xs mb-1">HP Cost</div>
                      <div className="text-white font-semibold">{skill.hp}</div>
                    </div>
                )}
                {skill.delay !== "—" && (
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Cast Time</div>
                      <div className="text-white font-semibold">{skill.delay}s</div>
                    </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-4 text-sm text-slate-300 leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: translatedDesc }} />
            </div>

            {/* Level selector */}
            {skill.ranks.length > 1 && (
                <div>
                  <div className="text-xs text-slate-400 mb-2">Lv. {skill.ranks[0].level} - Lv. {skill.ranks[skill.ranks.length - 1].level}</div>
                  <div className="flex flex-wrap gap-2">
                    {skill.ranks.map((rank) => {
                      const isActive = selectedRank === rank.level;
                      return (
                          <button
                              key={rank.level}
                              onClick={() => setSelectedRank(rank.level)}
                              className="px-3 py-1.5 text-sm rounded transition-colors font-medium"
                              style={{
                                background: isActive ? "rgb(59, 130, 246)" : "rgb(51, 65, 85)",
                                color: "white",
                                border: `1px solid ${isActive ? "rgb(96, 165, 250)" : "rgb(71, 85, 105)"}`,
                              }}
                          >
                            {rank.level}
                          </button>
                      );
                    })}
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>,
      document.body
  );
}

