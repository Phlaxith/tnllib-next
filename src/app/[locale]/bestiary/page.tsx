"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MONSTER_MODELS, type MonsterEntry, type MonsterCategory } from "@/lib/models";

const MonsterViewer = dynamic(() => import("@/components/MonsterViewer"), { ssr: false });

const CATEGORY_LABEL: Record<MonsterCategory, string> = {
  "common":     "Common",
  "elite":      "Elite",
  "boss":       "Boss",
  "world-boss": "World Boss",
};

const CATEGORY_COLOR: Record<MonsterCategory, string> = {
  "common":     "var(--text-secondary)",
  "elite":      "var(--green)",
  "boss":       "var(--gold)",
  "world-boss": "var(--red)",
};

const ALL_CATEGORIES: Array<"all" | MonsterCategory> = [
  "all", "common", "elite", "boss", "world-boss",
];

export default function BestiaryPage() {
  const [selected,    setSelected]    = useState<MonsterEntry | null>(MONSTER_MODELS[0] ?? null);
  const [search,      setSearch]      = useState("");
  const [catFilter,   setCatFilter]   = useState<"all" | MonsterCategory>("all");
  const [searchFocus, setSearchFocus] = useState(false);

  const filtered = MONSTER_MODELS.filter((m) => {
    const matchCat    = catFilter === "all" || m.category === catFilter;
    const matchSearch = !search   || m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col gap-3" style={{ height: "calc(100vh - 4rem)" }}>

      {/* ── Header ── */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Bestiaire 3D
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Éditez
          <code className="px-1 rounded" style={{ background: "var(--bg-card)", color: "var(--accent-bright)" }}>
            src/lib/models.ts
          </code>
          {" "}· GLB dans
          <code className="px-1 rounded" style={{ background: "var(--bg-card)", color: "var(--accent-bright)" }}>
            public/models/monsters/
          </code>
        </p>
      </div>

      {MONSTER_MODELS.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 rounded-2xl border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="text-4xl">🐉</div>
          <div className="text-center">
            <div className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Aucun monstre configuré</div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Ouvrez
              <code className="px-1 rounded" style={{ background: "var(--bg-secondary)", color: "var(--accent-bright)" }}>
                src/lib/models.ts
              </code>
              et ajoutez vos monstres dans <code>MONSTER_MODELS</code>
            </div>
          </div>
        </div>
      ) : (
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
            <div className="flex flex-wrap gap-1 shrink-0">
              {ALL_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className="px-2 py-1 rounded-lg text-xs font-medium transition-all border"
                  style={{
                    background:  catFilter === c ? "var(--accent-glow)" : "var(--bg-card)",
                    borderColor: catFilter === c ? "var(--accent)"      : "var(--border)",
                    color:       catFilter === c ? "var(--accent-bright)": "var(--text-muted)",
                  }}>
                  {c === "all" ? "Tout" : CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>

            {/* Count */}
            <div className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
              {filtered.length} / {MONSTER_MODELS.length} créatures
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
                      flexShrink: 0,
                    }}>
                    {/* Category dot */}
                    <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-lg"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                      {m.category === "world-boss" ? "💀" : m.category === "boss" ? "👑" : m.category === "elite" ? "⚔️" : "🐾"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate"
                          style={{ color: isSelected ? "var(--accent-bright)" : "var(--text-primary)" }}>
                          {m.name}
                        </span>
                        <span className="text-xs px-1.5 rounded-full shrink-0 font-medium"
                          style={{
                            background: `${CATEGORY_COLOR[m.category]}20`,
                            color: CATEGORY_COLOR[m.category],
                          }}>
                          {CATEGORY_LABEL[m.category]}
                        </span>
                      </div>
                      {m.description && (
                        <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                          {m.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  Aucun résultat
                </div>
              )}
            </div>
          </div>

          {/* ══ Right panel : 3D viewer ══ */}
          <div className="flex flex-col gap-2 overflow-hidden" style={{ minHeight: 0 }}>
            {selected ? (
              <>
                {/* Monster name bar */}
                <div className="shrink-0 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-lg"
                    style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                    {selected.category === "world-boss" ? "💀" : selected.category === "boss" ? "👑" : selected.category === "elite" ? "⚔️" : "🐾"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-base truncate" style={{ color: "var(--text-primary)" }}>
                        {selected.name}
                      </h2>
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                        style={{
                          background: `${CATEGORY_COLOR[selected.category]}20`,
                          color: CATEGORY_COLOR[selected.category],
                        }}>
                        {CATEGORY_LABEL[selected.category]}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {selected.description && <span>{selected.description} · </span>}
                      <span className="font-mono" style={{ color: "var(--border-bright)" }}>
                        {selected.id}.glb
                      </span>
                    </div>
                  </div>
                </div>

                {/* Full-height viewer */}
                <div style={{ flex: 1, minHeight: 0 }}>
                  <MonsterViewer
                    modelUrl={selected.modelPath ?? `/models/monsters/${selected.id}.glb`}
                    animationName={selected.animationName}
                    height="100%"
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center rounded-2xl border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                Sélectionnez une créature
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
