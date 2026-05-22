"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { WEAPON_MODELS, type ModelEntry, type WeaponType } from "@/lib/models";

const ItemViewer = dynamic(() => import("@/components/ItemViewer"), { ssr: false });

const WEAPON_ICON: Record<WeaponType, string> = {
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

const CATEGORY_LABEL: Record<string, string> = { item: "Item", skin: "Skin" };
const CATEGORY_COLOR: Record<string, string> = {
  item: "var(--accent-bright)",
  skin: "var(--gold)",
};

const ALL_TYPES: Array<"all" | WeaponType> = [
  "all", "bow", "crossbow", "dagger", "gauntlet", "orb",
  "spear", "staff", "sword", "sword2h", "wand",
];

export default function WeaponItemsPage() {
  const t = useTranslations("itemViewer");

  const [selected,    setSelected]    = useState<ModelEntry | null>(WEAPON_MODELS[0] ?? null);
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState<"all" | WeaponType>("all");
  const [catFilter,   setCatFilter]   = useState<"all" | "item" | "skin">("all");
  const [searchFocus, setSearchFocus] = useState(false);

  const filtered = WEAPON_MODELS.filter((m) => {
    const matchType   = typeFilter === "all" || m.type === typeFilter;
    const matchCat    = catFilter  === "all" || m.category === catFilter;
    const matchSearch = !search    || m.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col gap-3" style={{ height: "calc(100vh - 4rem)" }}>

      {/* ── Header ── */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {t("title")}
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Éditez{" "}
          <code className="px-1 rounded" style={{ background: "var(--bg-card)", color: "var(--accent-bright)" }}>
            src/lib/models.ts
          </code>
          {" "}· GLB dans{" "}
          <code className="px-1 rounded" style={{ background: "var(--bg-card)", color: "var(--accent-bright)" }}>
            public/models/weapons/
          </code>
        </p>
      </div>

      {WEAPON_MODELS.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 rounded-2xl border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="text-4xl">📦</div>
          <div className="text-center">
            <div className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Aucun modèle configuré</div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Ouvrez <code className="px-1 rounded" style={{ background: "var(--bg-secondary)", color: "var(--accent-bright)" }}>src/lib/models.ts</code> et ajoutez vos modèles dans <code>WEAPON_MODELS</code>
            </div>
          </div>
        </div>
      ) : (
        /* ── Two-column layout: inline style to bypass Tailwind v4 arbitrary grid ── */
        <div
          className="flex-1 overflow-hidden"
          style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1rem", minHeight: 0 }}
        >
          {/* ══ Left panel ══ */}
          <div className="flex flex-col gap-2 overflow-hidden">

            {/* Search */}
            <div className="relative shrink-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: "var(--text-muted)" }}>
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
                className="w-full pl-8 pr-3 py-2 rounded-lg text-sm border outline-none"
                style={{
                  background:  "var(--bg-card)",
                  borderColor: searchFocus ? "var(--accent)" : "var(--border)",
                  color:       "var(--text-primary)",
                }}
              />
            </div>

            {/* Category filter */}
            <div className="flex gap-1 shrink-0">
              {(["all", "item", "skin"] as const).map((c) => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className="flex-1 py-1 rounded-lg text-xs font-medium transition-all border"
                  style={{
                    background:  catFilter === c ? "var(--accent-glow)" : "var(--bg-card)",
                    borderColor: catFilter === c ? "var(--accent)"      : "var(--border)",
                    color:       catFilter === c ? "var(--accent-bright)": "var(--text-muted)",
                  }}>
                  {c === "all" ? "Tout" : CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="flex flex-wrap gap-1 shrink-0">
              {ALL_TYPES.map((wt) => (
                <button key={wt} onClick={() => setTypeFilter(wt)}
                  className="px-2 py-1 rounded-lg text-xs font-medium transition-all border"
                  style={{
                    background:  typeFilter === wt ? "var(--accent-glow)" : "var(--bg-card)",
                    borderColor: typeFilter === wt ? "var(--accent)"      : "var(--border)",
                    color:       typeFilter === wt ? "var(--accent-bright)": "var(--text-muted)",
                  }}>
                  {wt === "all" ? t("filterAll") : wt}
                </button>
              ))}
            </div>

            {/* Count */}
            <div className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
              {filtered.length} / {WEAPON_MODELS.length} modèles
            </div>

            {/* Scrollable list */}
            <div className="flex flex-col gap-1 overflow-y-auto" style={{ flex: 1, minHeight: 0 }}>
              {filtered.map((m) => {
                const isSelected = selected?.id === m.id;
                return (
                  <button key={m.id} onClick={() => setSelected(m)}
                    className="w-full text-left rounded-xl px-3 py-2.5 border flex items-center gap-3 transition-all"
                    style={{
                      background:  isSelected ? "var(--accent-glow)" : "var(--bg-card)",
                      borderColor: isSelected ? "var(--accent)"      : "var(--border)",
                      flexShrink:  0,
                    }}>
                    <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={WEAPON_ICON[m.type]} alt={m.type} width={26} height={26}
                        style={{ objectFit: "contain", opacity: isSelected ? 1 : 0.65 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate"
                          style={{ color: isSelected ? "var(--accent-bright)" : "var(--text-primary)" }}>
                          {m.name}
                        </span>
                        <span className="text-xs px-1.5 rounded-full shrink-0 font-medium"
                          style={{ background: `${CATEGORY_COLOR[m.category]}20`, color: CATEGORY_COLOR[m.category] }}>
                          {CATEGORY_LABEL[m.category]}
                        </span>
                      </div>
                      <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {m.type}{m.description ? ` · ${m.description}` : ""}
                      </div>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>{t("noResults")}</div>
              )}
            </div>
          </div>

          {/* ══ Right panel : 3D viewer ══ */}
          <div className="flex flex-col gap-2 overflow-hidden" style={{ minHeight: 0 }}>
            {selected ? (
              <>
                {/* Item name bar */}
                <div className="shrink-0 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
                    style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={WEAPON_ICON[selected.type]} alt={selected.type} width={26} height={26} style={{ objectFit: "contain" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-base truncate" style={{ color: "var(--text-primary)" }}>{selected.name}</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                        style={{ background: `${CATEGORY_COLOR[selected.category]}20`, color: CATEGORY_COLOR[selected.category] }}>
                        {CATEGORY_LABEL[selected.category]}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {selected.type}
                      {selected.description && <> · {selected.description}</>}
                      <span className="ml-2 font-mono" style={{ color: "var(--border-bright)" }}>{selected.id}.glb</span>
                    </div>
                  </div>
                </div>

                {/* Full-height viewer */}
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ItemViewer
                    modelUrl={selected.modelPath ?? `/models/weapons/${selected.id}.glb`}
                    weaponType={selected.type}
                    height="100%"
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center rounded-2xl border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                Sélectionnez un modèle
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
