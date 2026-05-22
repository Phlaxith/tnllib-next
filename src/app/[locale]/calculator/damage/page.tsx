"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import SliderField from "@/components/ui/SliderField";
import StatCard from "@/components/ui/StatCard";
import {
  DEFAULT_PARAMS, DamageParams,
  getChance, getHealChance,
  calcMinDmg, calcMaxCrit, calcAvgSkillDmg,
  calcMinDot, calcMaxCritDot, calcAvgDotDmg,
  calcMinHeal, calcMaxCritHeal, calcAvgHeal,
  calcMinHot, calcMaxCritHot, calcAvgHot,
} from "@/lib/math";
import { Swords, Heart, FlameKindling, Droplets } from "lucide-react";

type Tab = "damage" | "dot" | "heal" | "hot";

export default function DamageCalculatorPage() {
  const t = useTranslations("calculator");
  const [params, setParams] = useState<DamageParams>(DEFAULT_PARAMS);
  const [tab, setTab] = useState<Tab>("damage");

  const set = (key: keyof DamageParams, val: number) =>
    setParams((p) => ({ ...p, [key]: val }));

  const SLIDERS: { key: keyof DamageParams; min: number; max: number; step?: number }[] = [
    { key: "skillPer",   min: 0,  max: 3000 },
    { key: "skillFlat",  min: 0,  max: 1500 },
    { key: "minDmg",     min: 0,  max: 2000 },
    { key: "maxDmg",     min: 0,  max: 2000 },
    { key: "monsterDmg", min: 0,  max: 200  },
    { key: "dmgBuff1",   min: 0,  max: 300  },
    { key: "dmgBuff2",   min: 0,  max: 300  },
    { key: "sdb",        min: 0,  max: 2000, step: 0.1 },
    { key: "ssdb",       min: 0,  max: 1000, step: 0.1 },
    { key: "bonusDmg",   min: 0,  max: 500  },
    { key: "defense",    min: 0,  max: 5000 },
    { key: "critHit",    min: 0,  max: 5000 },
    { key: "critDamage", min: 0,  max: 150  },
    { key: "heavyHit",   min: 0,  max: 3000 },
    { key: "heavyDmg",   min: 0,  max: 300  },
    { key: "curse",      min: 0,  max: 300, step: 0.1 },
  ];

  const TABS = [
    { id: "damage" as Tab, icon: <Swords size={14} /> },
    { id: "dot"    as Tab, icon: <FlameKindling size={14} /> },
    { id: "heal"   as Tab, icon: <Heart size={14} /> },
    { id: "hot"    as Tab, icon: <Droplets size={14} /> },
  ];

  function getResults(p: DamageParams, tab: Tab) {
    if (tab === "damage") return [
      { label: t("results.critChance"),  value: `${(getChance(p.critHit)*100).toFixed(2)}%`,  color: "gold" as const },
      { label: t("results.heavyChance"), value: `${(getChance(p.heavyHit)*100).toFixed(2)}%`, color: "default" as const },
      { label: t("results.minDmg"),      value: calcMinDmg(p).toFixed(0),                     color: "default" as const },
      { label: t("results.maxCrit"),     value: calcMaxCrit(p).toFixed(0),                    color: "red" as const },
      { label: t("results.avgDmg"),      value: calcAvgSkillDmg(p).toFixed(0),                color: "gold" as const },
    ];
    if (tab === "dot") return [
      { label: t("results.critChance"), value: `${(getChance(p.critHit)*100).toFixed(2)}%`,  color: "gold" as const },
      { label: t("results.dotAvg"),     value: calcMinDot(p).toFixed(0),                     color: "default" as const },
      { label: t("results.dotMaxCrit"), value: calcMaxCritDot(p).toFixed(0),                 color: "red" as const },
      { label: t("results.dotTotal"),   value: calcAvgDotDmg(p).toFixed(0),                  color: "gold" as const },
    ];
    if (tab === "heal") return [
      { label: t("results.healCritChance"), value: `${(getHealChance(p.critHit)*100).toFixed(2)}%`, color: "green" as const },
      { label: t("results.minHeal"),        value: calcMinHeal(p).toFixed(0),                       color: "default" as const },
      { label: t("results.maxCritHeal"),    value: calcMaxCritHeal(p).toFixed(0),                   color: "green" as const },
      { label: t("results.avgHeal"),        value: calcAvgHeal(p).toFixed(0),                       color: "green" as const },
    ];
    return [
      { label: t("results.hotCritChance"), value: `${(getHealChance(p.critHit)*100).toFixed(2)}%`, color: "green" as const },
      { label: t("results.minHot"),        value: calcMinHot(p).toFixed(0),                        color: "default" as const },
      { label: t("results.maxCritHot"),    value: calcMaxCritHot(p).toFixed(0),                    color: "green" as const },
      { label: t("results.avgHot"),        value: calcAvgHot(p).toFixed(0),                        color: "green" as const },
    ];
  }

  const results = getResults(params, tab);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <Swords size={28} style={{ color: "var(--accent)" }} />
        {t("title")}
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>{t("subtitle")}</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sliders */}
        <div className="lg:col-span-2 rounded-2xl border p-5 flex flex-col gap-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t("params")}</div>
          {SLIDERS.map(({ key, min, max, step }) => (
            <SliderField
              key={key}
              label={t(`sliders.${key}`)}
              value={params[key]}
              min={min}
              max={max}
              step={step}
              onChange={(v) => set(key, v)}
            />
          ))}
        </div>

        {/* Résultats */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {TABS.map((tb) => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border"
                style={{
                  background: tab === tb.id ? "var(--accent-glow)" : "var(--bg-card)",
                  borderColor: tab === tb.id ? "var(--accent)" : "var(--border)",
                  color: tab === tb.id ? "var(--accent-bright)" : "var(--text-secondary)",
                }}
              >
                {tb.icon} {t(`tabs.${tb.id}`)}
              </button>
            ))}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            {results.map((r) => (
              <StatCard key={r.label} label={r.label} value={r.value} color={r.color} />
            ))}
          </div>

          {/* Formulas */}
          <div className="rounded-xl border p-4 text-xs leading-relaxed" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
            <div className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>{t("formulas")}</div>
            <div>{t("formula1")}</div>
            <div>{t("formula2")}</div>
            <div>{t("formula3")}</div>
            <div>{t("formula4")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

