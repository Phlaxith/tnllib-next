"use client";

import { useState } from "react";
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

const SLIDER_CONFIG: { key: keyof DamageParams; label: string; min: number; max: number; step?: number }[] = [
  { key: "skillPer",   label: "Skill % Damage",          min: 0,  max: 3000 },
  { key: "skillFlat",  label: "Skill Flat Damage",        min: 0,  max: 1500 },
  { key: "minDmg",     label: "Min Damage (weapon)",      min: 0,  max: 2000 },
  { key: "maxDmg",     label: "Max Damage (weapon)",      min: 0,  max: 2000 },
  { key: "monsterDmg", label: "Monster Damage Boost %",   min: 0,  max: 200  },
  { key: "dmgBuff1",   label: "Damage Buff % (Skill)",    min: 0,  max: 300  },
  { key: "dmgBuff2",   label: "Secondary Buff %",         min: 0,  max: 300  },
  { key: "sdb",        label: "Skill Damage Boost",       min: 0,  max: 2000, step: 0.1 },
  { key: "ssdb",       label: "Species Damage Boost",     min: 0,  max: 1000, step: 0.1 },
  { key: "bonusDmg",   label: "Bonus Damage (flat)",      min: 0,  max: 500  },
  { key: "defense",    label: "Target Defense",           min: 0,  max: 5000 },
  { key: "critHit",    label: "Critical Chance",          min: 0,  max: 5000 },
  { key: "critDamage", label: "Critical Damage %",        min: 0,  max: 150  },
  { key: "heavyHit",   label: "Heavy Hit Chance",         min: 0,  max: 3000 },
  { key: "heavyDmg",   label: "Heavy % Bonus",            min: 0,  max: 300  },
  { key: "curse",      label: "Curse/Heal %",             min: 0,  max: 300, step: 0.1 },
];

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "damage", label: "Damage",  icon: <Swords size={14} /> },
  { id: "dot",    label: "DoT",     icon: <FlameKindling size={14} /> },
  { id: "heal",   label: "Healing", icon: <Heart size={14} /> },
  { id: "hot",    label: "HoT",     icon: <Droplets size={14} /> },
];

function getResults(p: DamageParams, tab: Tab) {
  if (tab === "damage") return [
    { label: "Crit Chance",      value: `${(getChance(p.critHit)*100).toFixed(2)}%`,  color: "gold" as const },
    { label: "Heavy Chance",     value: `${(getChance(p.heavyHit)*100).toFixed(2)}%`, color: "default" as const },
    { label: "Min Damage",       value: calcMinDmg(p).toFixed(0),                     color: "default" as const },
    { label: "Max Crit Damage",  value: calcMaxCrit(p).toFixed(0),                    color: "red" as const },
    { label: "Avg Total Damage", value: calcAvgSkillDmg(p).toFixed(0),                color: "gold" as const },
  ];
  if (tab === "dot") return [
    { label: "Crit Chance",   value: `${(getChance(p.critHit)*100).toFixed(2)}%`, color: "gold" as const },
    { label: "Avg DoT",       value: calcMinDot(p).toFixed(0),                    color: "default" as const },
    { label: "Max Crit DoT",  value: calcMaxCritDot(p).toFixed(0),                color: "red" as const },
    { label: "Avg Total DoT", value: calcAvgDotDmg(p).toFixed(0),                 color: "gold" as const },
  ];
  if (tab === "heal") return [
    { label: "Heal Crit Chance", value: `${(getHealChance(p.critHit)*100).toFixed(2)}%`, color: "green" as const },
    { label: "Min Heal",         value: calcMinHeal(p).toFixed(0),                        color: "default" as const },
    { label: "Max Crit Heal",    value: calcMaxCritHeal(p).toFixed(0),                    color: "green" as const },
    { label: "Avg Total Heal",   value: calcAvgHeal(p).toFixed(0),                        color: "green" as const },
  ];
  return [
    { label: "HoT Crit Chance", value: `${(getHealChance(p.critHit)*100).toFixed(2)}%`, color: "green" as const },
    { label: "Min HoT",         value: calcMinHot(p).toFixed(0),                         color: "default" as const },
    { label: "Max Crit HoT",    value: calcMaxCritHot(p).toFixed(0),                     color: "green" as const },
    { label: "Avg Total HoT",   value: calcAvgHot(p).toFixed(0),                         color: "green" as const },
  ];
}

export default function DamageCalculatorPage() {
  const [params, setParams] = useState<DamageParams>(DEFAULT_PARAMS);
  const [tab, setTab] = useState<Tab>("damage");

  const set = (key: keyof DamageParams, val: number) =>
    setParams((p) => ({ ...p, [key]: val }));

  const results = getResults(params, tab);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <Swords size={28} style={{ color: "var(--accent)" }} />
        Damage / Healing Calculator
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>Adjust parameters, results update in real time.</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sliders */}
        <div className="lg:col-span-2 rounded-2xl border p-5 flex flex-col gap-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Parameters</div>
          {SLIDER_CONFIG.map(({ key, label, min, max, step }) => (
            <SliderField key={key} label={label} value={params[key]} min={min} max={max} step={step} onChange={(v) => set(key, v)} />
          ))}
        </div>

        {/* Results */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {TABS.map((tb) => (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border"
                style={{
                  background: tab === tb.id ? "var(--accent-glow)" : "var(--bg-card)",
                  borderColor: tab === tb.id ? "var(--accent)" : "var(--border)",
                  color: tab === tb.id ? "var(--accent-bright)" : "var(--text-secondary)",
                }}>
                {tb.icon} {tb.label}
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
            <div className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Formulas used</div>
            <div>• Chance = rate / (rate + 1000)</div>
            <div>• Heal Chance = rate / (rate + 3000)</div>
            <div>• Mitigation = 1 / (1 + def / 2700)</div>
            <div>• Base Damage = (weapon × skill%) + flat damage</div>
          </div>
        </div>
      </div>
    </div>
  );
}

