"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  category: "active" | "passive" | "other";
  delay: number | string;
  hitDelay: number | string;
  chargeDelay: number | string;
  mp: string | number;
  hp: string | number;
  cooldown: string | number;
  ranks: SkillRank[];
  TranslatedName?: string;
  TranslatedType?: string;
}

interface WeaponPageClientProps {
  weapon: string;
}

// Charger le mapping des skills (généré depuis les fichiers XML)
let skillTypeMapping: { active: string[]; passive: string[] } | null = null;

async function loadSkillMapping() {
  if (skillTypeMapping) return skillTypeMapping;
  try {
    const response = await fetch("/data/skill-type-mapping.json");
    skillTypeMapping = await response.json();
    return skillTypeMapping;
  } catch (error) {
    console.error("Failed to load skill mapping:", error);
    return { active: [], passive: [] };
  }
}

// Fonction helper pour déterminer la catégorie du skill
function getSkillCategory(skillId: string, mapping: { active: string[]; passive: string[] }): "active" | "passive" | "other" {
  // Correspondance exacte
  if (mapping.active.includes(skillId)) return "active";
  if (mapping.passive.includes(skillId)) return "passive";

  // Correspondance partielle : chercher si un ID du mapping est contenu dans skillId
  // Ex: "WP_SW_SH_S_ShieldThrow" contient "SkillSet_WP_SW_SH_S_ShieldThrow"
  // ou "SkillSet_WP_SW_SH_S_ShieldThrow_trait_1" contient "SkillSet_WP_SW_SH_S_ShieldThrow"

  // Nettoyer l'ID des suffixes courants
  const cleanId = skillId
    .replace(/_trait_\d+$/, '')
    .replace(/_Hero$/, '')
    .replace(/_Rare$/, '')
    .replace(/_slot.*$/, '')
    .replace(/_Stack\d+$/, '')
    .replace(/_(AA|SP)(_.*)?$/, '');

  // Chercher dans les actifs avec le préfixe SkillSet_
  const withSkillSet = cleanId.startsWith('SkillSet_') ? cleanId : `SkillSet_${cleanId}`;
  if (mapping.active.includes(withSkillSet)) return "active";
  if (mapping.passive.includes(withSkillSet)) return "passive";

  // Chercher dans les actifs sans le préfixe SkillSet_
  const withoutSkillSet = cleanId.replace(/^SkillSet_/, '');
  const matchActive = mapping.active.find(id =>
    id.includes(withoutSkillSet) || withoutSkillSet.includes(id.replace(/^SkillSet_/, ''))
  );
  if (matchActive) return "active";

  const matchPassive = mapping.passive.find(id =>
    id.includes(withoutSkillSet) || withoutSkillSet.includes(id.replace(/^SkillSet_/, ''))
  );
  if (matchPassive) return "passive";

  return "other";
}

export default function WeaponPageClient({ weapon }: WeaponPageClientProps) {
  const { t: tSkill } = useTranslation("TLStringSkillDesc");
  const [data, setData] = useState<SkillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "passive">("active");

  const weaponFile = WEAPON_FILES[weapon];
  const weaponName = WEAPON_NAMES[weapon] ?? weapon;

  useEffect(() => {
    if (!weaponFile) return;

    async function load() {
      setLoading(true);
      setError(null);
      setData([]);
      try {
        const [formulaRaw, optionalRaw, looksRaw, skillRaw, skillMapping] = await Promise.all([
          fetchGzJson("/data/TLFormulaParameterNew.gz"),
          fetchGzJson("/data/TLSkillOptionalDataForPc.gz"),
          fetchGzJson(`/data/${weaponFile}.gz`),
          fetchGzJson("/data/TLSkill.gz"),
          loadSkillMapping(),
        ]) as [unknown, unknown, unknown, unknown, { active: string[]; passive: string[] }];

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
        const skillGroups = new Map<string, string>(); // UIName.Key -> first skillId

        // Premier passage : regrouper les skills par UIName.Key (plus fiable pour éviter les doublons)
        for (const [key, value] of Object.entries(looksRows)) {
          const uiNameKey = value.UIName?.Key ?? "";
          
          if (uiNameKey) {
            // Utiliser la clé de traduction comme identifiant unique
            if (!skillGroups.has(uiNameKey)) {
              skillGroups.set(uiNameKey, key);
            }
          } else {
            // Fallback : utiliser le nom normalisé si pas de UIName.Key
            const baseSkillName = key
              .replace(/^SkillSet_/, '')
              .replace(/_trait_\d+$/, '')
              .replace(/_Hero$/, '')
              .replace(/_Rare$/, '')
              .replace(/_slot.*$/, '')
              .replace(/_Stack\d+$/, '')
              .replace(/_(AA|SP)(_.*)?$/, '');

            if (!skillGroups.has(baseSkillName)) {
              skillGroups.set(baseSkillName, key);
            }
          }
        }

        // Deuxième passage : créer les lignes pour les skills uniques
        for (const [, key] of skillGroups.entries()) {
          if (!(key in optionalRows)) continue;

          const value = looksRows[key];
          const optional = optionalRows[key] ?? {};
          const skill = skillRows[key] ?? {};

          const iconPath = value.IconPath?.AssetPathName ?? "";
          const iconUrl = unrealPathToPublic(iconPath);
          const damageType = skill.damage_type?.split("::k")[1] ?? "—";

          // Extraire le nom de base pour le matching
          const baseSkillName = key
            .replace(/^SkillSet_/, '')
            .replace(/_trait_\d+$/, '')
            .replace(/_Hero$/, '')
            .replace(/_Rare$/, '')
            .replace(/_slot.*$/, '')
            .replace(/_Stack\d+$/, '')
            .replace(/_(AA|SP)(_.*)?$/, '');

          // Chercher avec le préfixe SkillSet_ pour le matching
          const skillIdForMatching = `SkillSet_${baseSkillName}`;
          const category = getSkillCategory(skillIdForMatching, skillMapping);

          // Ignorer les skills "other"
          if (category === "other") continue;

          // Récupérer tous les rangs du skill
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
    }));
  }, [data, tSkill]);

  // Séparer les skills actifs et passifs
  const activeSkills = useMemo(
      () => translatedData.filter((s) => s.category === "active"),
      [translatedData]
  );
  const passiveSkills = useMemo(
      () => translatedData.filter((s) => s.category === "passive"),
      [translatedData]
  );

  // Les données affichées selon l'onglet actif
  const displayedData = activeTab === "active" ? activeSkills : passiveSkills;

  // Colonnes pour le tableau
  const columns: ColumnDef<SkillRow, unknown>[] = useMemo(
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
          accessorKey: "TranslatedType",
          header: "Type",
          cell: (i) => {
            const v = i.getValue() as string;
            return v && v !== "—" ? (
                <span
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ background: "var(--accent-glow)", color: "var(--accent-bright)" }}
                >
              {v}
            </span>
            ) : null;
          },
        },
        {
          accessorKey: "cooldown",
          header: "Cooldown",
          cell: (i) => {
            const v = i.getValue();
            return v !== "—" ? `${v}s` : "—";
          },
        },
        {
          accessorKey: "mp",
          header: "MP Cost",
        },
      ],
      []
  );

  // Guard: unknown weapon
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
              {/* Tabs Active/Passive */}
              <div className="mb-6 flex gap-2 border-b" style={{ borderColor: "var(--border)" }}>
                <button
                    onClick={() => setActiveTab("active")}
                    className="px-4 py-2 font-semibold transition-colors relative"
                    style={{
                      color: activeTab === "active" ? "var(--accent-bright)" : "var(--text-muted)",
                    }}
                >
                  ⚔️ Active Skills ({activeSkills.length})
                  {activeTab === "active" && (
                      <div
                          className="absolute bottom-0 left-0 right-0 h-0.5"
                          style={{ background: "var(--accent)" }}
                      />
                  )}
                </button>
                <button
                    onClick={() => setActiveTab("passive")}
                    className="px-4 py-2 font-semibold transition-colors relative"
                    style={{
                      color: activeTab === "passive" ? "var(--accent-bright)" : "var(--text-muted)",
                    }}
                >
                  🛡️ Passive Skills ({passiveSkills.length})
                  {activeTab === "passive" && (
                      <div
                          className="absolute bottom-0 left-0 right-0 h-0.5"
                          style={{ background: "var(--accent)" }}
                      />
                  )}
                </button>
              </div>

              {/* Tableau avec DataTable mais lignes cliquables */}
              <DataTableClickable
                  data={displayedData}
                  columns={columns}
                  searchPlaceholder="Search a skill…"
                  onRowClick={(skill) => setExpandedSkill(expandedSkill === skill.internal ? null : skill.internal)}
                  expandedSkill={expandedSkill}
                  tSkill={tSkill}
              />
            </>
        )}
      </div>
  );
}

// Version modifiée du DataTable avec lignes cliquables et expandables
function DataTableClickable<T extends SkillRow>({
                                                  data,
                                                  columns,
                                                  searchPlaceholder,
                                                  onRowClick,
                                                  expandedSkill,
                                                  tSkill,
                                                }: {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  searchPlaceholder?: string;
  onRowClick: (row: T) => void;
  expandedSkill: string | null;
  tSkill: (key: string, fallback: string) => string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedRank, setSelectedRank] = useState<Record<string, number>>({});

  const table = useReactTable({
    data,
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

        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          {table.getFilteredRowModel().rows.length} results
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
            {table.getRowModel().rows.map((row) => {
              const isExpanded = expandedSkill === row.original.internal;
              const currentRank = selectedRank[row.original.internal] || 1;
              const rankData = row.original.ranks[currentRank - 1];
              const translatedDesc = rankData ? tSkill(rankData.descriptionKey, rankData.description) : "";

              return (
                <React.Fragment key={row.id}>
                  <tr
                    onClick={() => onRowClick(row.original)}
                    className="cursor-pointer transition-colors hover:bg-opacity-50"
                    style={{
                      borderBottom: isExpanded ? "none" : "1px solid var(--border)",
                      background: isExpanded ? "var(--bg-secondary)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) e.currentTarget.style.background = "var(--bg-secondary)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                    ))}
                  </tr>

                  {/* Ligne expandée avec les détails */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-4" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Stats */}
                          <div>
                            <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                              Stats
                            </div>
                            <div className="space-y-2">
                              {row.original.cooldown !== "—" && (
                                <div className="flex justify-between text-sm">
                                  <span style={{ color: "var(--text-muted)" }}>Cooldown:</span>
                                  <span style={{ color: "var(--text-primary)" }} className="font-semibold">{row.original.cooldown}s</span>
                                </div>
                              )}
                              {row.original.mp !== "—" && (
                                <div className="flex justify-between text-sm">
                                  <span style={{ color: "var(--text-muted)" }}>MP Cost:</span>
                                  <span style={{ color: "var(--text-primary)" }} className="font-semibold">{row.original.mp}</span>
                                </div>
                              )}
                              {row.original.hp !== "—" && (
                                <div className="flex justify-between text-sm">
                                  <span style={{ color: "var(--text-muted)" }}>HP Cost:</span>
                                  <span style={{ color: "var(--text-primary)" }} className="font-semibold">{row.original.hp}</span>
                                </div>
                              )}
                              {row.original.delay !== "—" && (
                                <div className="flex justify-between text-sm">
                                  <span style={{ color: "var(--text-muted)" }}>Cast Time:</span>
                                  <span style={{ color: "var(--text-primary)" }} className="font-semibold">{row.original.delay}s</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Levels */}
                          {row.original.ranks.length > 1 && (
                            <div>
                              <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                                Level
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {row.original.ranks.map((rank) => {
                                  const isActive = currentRank === rank.level;
                                  return (
                                    <button
                                      key={rank.level}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRank(prev => ({ ...prev, [row.original.internal]: rank.level }));
                                      }}
                                      className="px-2 py-1 text-xs rounded border transition-colors"
                                      style={{
                                        borderColor: isActive ? "var(--accent)" : "var(--border)",
                                        background: isActive ? "var(--accent-glow)" : "var(--bg-card)",
                                        color: isActive ? "var(--accent-bright)" : "var(--text-secondary)",
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

                        {/* Description */}
                        <div className="mt-4">
                          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                            Description
                          </div>
                          <div
                            className="text-sm p-3 rounded"
                            style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}
                            dangerouslySetInnerHTML={{ __html: translatedDesc }}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            </tbody>
          </table>
          {table.getRowModel().rows.length === 0 && (
              <div className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                No result
              </div>
          )}
        </div>
      </div>
  );
}