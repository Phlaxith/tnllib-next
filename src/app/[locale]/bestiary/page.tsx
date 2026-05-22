"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Skull, Info, Sword, Shield, Zap } from "lucide-react";

const MonsterViewer = dynamic(() => import("@/components/MonsterViewer"), { ssr: false });

type MonsterRarity = "Common" | "Elite" | "Boss" | "World Boss";

interface Monster {
  id: string;
  name: string;
  type: string;
  level: number;
  hp?: number;
  attack?: number;
  defense?: number;
  rarity: MonsterRarity;
  descKey: string;
  weaknesses?: string[];
  modelUrl?: string;
}

const RARITY_COLOR: Record<MonsterRarity, string> = {
  Common: "var(--text-secondary)",
  Elite: "var(--green)",
  Boss: "var(--gold)",
  "World Boss": "var(--red)",
};

const MONSTERS: Monster[] = [
  { id: "goblin_warrior",   name: "Goblin Warrior",   type: "Humanoid", level: 15, hp: 4200,    attack: 312,  defense: 180,  rarity: "Common",     descKey: "goblin",   weaknesses: ["Fire", "Light"] },
  {
    id: "cube", name: "Cube Test", type: "Common", level: 55, rarity: "Common", descKey: "cube",
    modelUrl: "/models/cube.glb"
  }
];

const MONSTER_DESC: Record<string, Record<string, string>> = {
  goblin:    { fr: "Un gobelin de base armé d'une dague rouillée. Faible seul, dangereux en groupe.", en: "A basic goblin armed with a rusty dagger. Weak alone, dangerous in groups." }
};

export default function BestiaryPage() {
  const t = useTranslations("bestiary");
  const [selected, setSelected] = useState<Monster>(MONSTERS[0]);
  // Detect locale from the URL
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] : "fr";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Skull size={28} style={{ color: "var(--red)" }} />
          {t("title")}
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          {t("subtitle")}{" "}
          <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-card)", color: "var(--accent-bright)" }}>.glb</code>{" "}
          {t("subtitleSuffix")}{" "}
          <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-card)", color: "var(--accent-bright)" }}>public/models/</code>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monster list */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            {MONSTERS.length} {t("creatures")}
          </div>
          {MONSTERS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              className="w-full text-left rounded-xl p-3 border transition-all"
              style={{
                background: selected.id === m.id ? "var(--bg-card-hover)" : "var(--bg-card)",
                borderColor: selected.id === m.id ? "var(--border-bright)" : "var(--border)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{m.name}</div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${RARITY_COLOR[m.rarity]}20`, color: RARITY_COLOR[m.rarity] }}>
                  {m.rarity}
                </span>
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Lv. {m.level} · {m.type}</div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <MonsterViewer modelUrl={selected.modelUrl} height={340} />

          <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{selected.name}</h2>
                <div className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Lv. {selected.level} · {selected.type}</div>
              </div>
              <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ background: `${RARITY_COLOR[selected.rarity]}20`, color: RARITY_COLOR[selected.rarity] }}>
                {selected.rarity}
              </span>
            </div>

            <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {MONSTER_DESC[selected.descKey]?.[locale] ?? MONSTER_DESC[selected.descKey]?.["en"]}
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: t("stats.hp"),      value: selected.hp?.toLocaleString(),      icon: <Shield size={14} />, color: "var(--green)" },
                { label: t("stats.attack"),  value: selected.attack?.toLocaleString(),  icon: <Sword size={14} />,  color: "var(--red)" },
                { label: t("stats.defense"), value: selected.defense?.toLocaleString(), icon: <Shield size={14} />, color: "var(--accent)" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg p-3 border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-1 text-xs mb-1" style={{ color: s.color }}>{s.icon} {s.label}</div>
                  <div className="font-bold" style={{ color: "var(--text-primary)" }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <Zap size={12} /> {t("weaknesses")}
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.weaknesses?.map((w) => (
                  <span key={w} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "var(--gold-glow)", color: "var(--gold)", border: "1px solid #f5c84240" }}>{w}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4 flex items-start gap-3" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
            <Info size={16} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--accent-bright)" }}>{t("infoTitle")}</strong>{" "}
              {t("infoText")}{" "}
              <code className="px-1 rounded" style={{ background: "var(--bg-card)", color: "var(--accent-bright)" }}>public/models/monster.glb</code>,{" "}
              {t("infoText2")}{" "}
              <code className="px-1 rounded" style={{ background: "var(--bg-card)", color: "var(--accent-bright)" }}>modelUrl: &quot;/models/monster.glb&quot;</code>{" "}
              {t("infoText3")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

