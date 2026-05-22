"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Swords, Info, Search, ChevronDown } from "lucide-react";
import { fetchGzJson, unrealPathToPublic } from "@/lib/utils";

const ItemViewer = dynamic(() => import("@/components/ItemViewer"), { ssr: false });

// Mapping du type de weapon slot → slug pour le placeholder 3D et l'icône
const SLOT_TO_TYPE: Record<string, string> = {
  Bow:        "bow",
  Crossbow:   "crossbow",
  Dagger:     "dagger",
  Gauntlet:   "gauntlet",
  Orb:        "orb",
  Spear:      "spear",
  Staff:      "staff",
  Sword:      "sword",
  Sword2h:    "sword2h",
  Wand:       "wand",
  // fallback
  TwoHand:    "sword2h",
  OneHand:    "sword",
};

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

const RARITY_COLOR: Record<string, string> = {
  Normal:    "var(--text-secondary)",
  Uncommon:  "var(--green)",
  Rare:      "#5b7cf6",
  Epic:      "#b44fe8",
  Legendary: "var(--gold)",
};

interface WeaponItem {
  id: string;
  name: string;
  type: string;           // bow, sword, etc.
  slot: string;           // raw slot name
  rarity: string;
  levelReq: number;
  icon: string;
  modelUrl?: string;
  minAtk: number;
  maxAtk: number;
  weight: number;
}

// Lecture et transformation de AllWeaponItems.json.gz
async function loadWeapons(): Promise<WeaponItem[]> {
  const raw = await fetchGzJson("/data/AllWeaponItems.json.gz") as unknown[];
  if (!Array.isArray(raw)) return [];

  return (raw as Record<string, unknown>[])
    .map((item) => {
      const slot = String(item.equip_slot_type ?? item.weapon_type ?? item.slot ?? "");
      const slotClean = slot.split("::k").pop() ?? slot;
      const type = SLOT_TO_TYPE[slotClean] ?? "sword";
      const rarity = String(item.item_grade ?? item.grade ?? "Normal").split("::k").pop() ?? "Normal";
      const iconPath = String(item.icon_path ?? item.IconPath ?? "");

      return {
        id:       String(item.item_id ?? item.id ?? Math.random()),
        name:     String(item.name ?? item.item_name ?? item.Name ?? "Unknown"),
        type,
        slot:     slotClean,
        rarity,
        levelReq: Number(item.require_level ?? item.level_limit ?? 0),
        icon:     unrealPathToPublic(iconPath || undefined),
        minAtk:   Number(item.min_attack ?? item.MinAtk ?? 0),
        maxAtk:   Number(item.max_attack ?? item.MaxAtk ?? 0),
        weight:   Number(item.weight ?? 0),
      };
    })
    .filter((w) => w.name && w.name !== "Unknown");
}

const WEAPON_TYPES = ["all", "bow", "crossbow", "dagger", "gauntlet", "orb", "spear", "staff", "sword", "sword2h", "wand"];

export default function WeaponItemsPage() {
  const t = useTranslations("itemViewer");
  const [weapons, setWeapons] = useState<WeaponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<WeaponItem | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    loadWeapons()
      .then((data) => {
        setWeapons(data);
        if (data.length > 0) setSelected(data[0]);
      })
      .catch(() => setError(t("error")))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() =>
    weapons.filter((w) => {
      const matchType = typeFilter === "all" || w.type === typeFilter;
      const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    }),
    [weapons, search, typeFilter]
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
          style={{ background: "var(--accent-glow)", border: "1px solid var(--border-bright)" }}>
          <img src="/Image/Weapon/Sword.png" alt="weapons" width={36} height={36} style={{ objectFit: "contain" }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{t("title")}</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{t("subtitle")}</p>
        </div>
      </div>

      {loading && <div className="py-20 text-center text-sm animate-pulse" style={{ color: "var(--text-muted)" }}>{t("loading")}</div>}
      {error  && <div className="rounded-xl border p-4 text-sm" style={{ background: "var(--bg-card)", borderColor: "var(--red)", color: "var(--red)" }}>⚠️ {error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left panel : filters + list ── */}
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder={t("search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg text-sm border outline-none"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>

            {/* Type filter tabs */}
            <div className="flex flex-wrap gap-1">
              {WEAPON_TYPES.map((wt) => (
                <button
                  key={wt}
                  onClick={() => setTypeFilter(wt)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all border"
                  style={{
                    background: typeFilter === wt ? "var(--accent-glow)" : "var(--bg-card)",
                    borderColor: typeFilter === wt ? "var(--accent)" : "var(--border)",
                    color: typeFilter === wt ? "var(--accent-bright)" : "var(--text-muted)",
                  }}
                >
                  {wt !== "all" && WEAPON_ICON[wt] && (
                    <img src={WEAPON_ICON[wt]} alt={wt} width={14} height={14} style={{ objectFit: "contain" }} />
                  )}
                  {wt === "all" ? t("filterAll") : wt}
                </button>
              ))}
            </div>

            {/* Count */}
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {filtered.length} {t("items")}
            </div>

            {/* List */}
            <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 320px)" }}>
              {filtered.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelected(w)}
                  className="w-full text-left rounded-xl px-3 py-2 border flex items-center gap-3 transition-all"
                  style={{
                    background: selected?.id === w.id ? "var(--bg-card-hover)" : "var(--bg-card)",
                    borderColor: selected?.id === w.id ? "var(--border-bright)" : "var(--border)",
                  }}
                >
                  {/* Icon */}
                  <div className="w-9 h-9 rounded shrink-0 flex items-center justify-center"
                    style={{ background: "var(--bg-secondary)" }}>
                    {w.icon
                      ? <img src={w.icon} alt="" width={32} height={32} loading="lazy" style={{ objectFit: "contain" }} />
                      : <img src={WEAPON_ICON[w.type] ?? "/Image/Weapon/Sword.png"} alt="" width={28} height={28} style={{ objectFit: "contain", opacity: 0.5 }} />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: RARITY_COLOR[w.rarity] ?? "var(--text-primary)" }}>
                      {w.name}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Lv. {w.levelReq} · {w.slot}
                    </div>
                  </div>
                </button>
              ))}

              {filtered.length === 0 && (
                <div className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>{t("noResults")}</div>
              )}
            </div>
          </div>

          {/* ── Right panel : viewer + stats ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {selected ? (
              <>
                {/* 3D Viewer */}
                <ItemViewer modelUrl={selected.modelUrl} weaponType={selected.type} height={340} />

                {/* Info card */}
                <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <div className="flex items-start gap-4 mb-4">
                    {/* Weapon icon */}
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center border shrink-0"
                      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                      {selected.icon
                        ? <img src={selected.icon} alt="" width={52} height={52} style={{ objectFit: "contain" }} />
                        : <img src={WEAPON_ICON[selected.type] ?? "/Image/Weapon/Sword.png"} alt="" width={44} height={44} style={{ objectFit: "contain", opacity: 0.5 }} />
                      }
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold" style={{ color: RARITY_COLOR[selected.rarity] ?? "var(--text-primary)" }}>
                        {selected.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${RARITY_COLOR[selected.rarity]}20`, color: RARITY_COLOR[selected.rarity] }}>
                          {selected.rarity}
                        </span>
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          {selected.slot} · {t("levelReq")} {selected.levelReq}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: t("minAtk"),  value: selected.minAtk.toLocaleString(), color: "var(--text-primary)" },
                      { label: t("maxAtk"),  value: selected.maxAtk.toLocaleString(), color: "var(--red)" },
                      { label: t("weight"),  value: selected.weight.toLocaleString(), color: "var(--text-secondary)" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg p-3 border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                        <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                        <div className="font-bold" style={{ color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GLB info */}
                <div className="rounded-xl border p-4 flex items-start gap-3" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                  <Info size={15} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
                  <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    <strong style={{ color: "var(--accent-bright)" }}>{t("infoTitle")}</strong>{" "}
                    {t("infoText")}{" "}
                    <code className="px-1 rounded text-xs" style={{ background: "var(--bg-card)", color: "var(--accent-bright)" }}>
                      public/models/weapons/{selected.id}.glb
                    </code>{" "}
                    {t("infoText2")}{" "}
                    <code className="px-1 rounded text-xs" style={{ background: "var(--bg-card)", color: "var(--accent-bright)" }}>
                      modelUrl: &quot;/models/weapons/{selected.id}.glb&quot;
                    </code>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64" style={{ color: "var(--text-muted)" }}>
                {t("selectItem")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

