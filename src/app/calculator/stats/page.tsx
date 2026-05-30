"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Activity } from "lucide-react";
import { fetchGzJson } from "@/lib/utils";

type FlatStat = {
  point: number;
  type: string;
  stat: string;
  value: number;
};

type StatSection = {
  suffix: string;
  label: string;
};

type CurvePoint = { x: number; y: number };

type FormulaCurve = {
  key: string;
  title: string;
  xLabel: string;
  yLabel: string;
  points: CurvePoint[];
};

const STAT_SECTIONS: StatSection[] = [
  { suffix: "STR", label: "Strength" },
  { suffix: "DEX", label: "Dexterity" },
  { suffix: "INT", label: "Wisdom" },
  { suffix: "PER", label: "Perception" },
  { suffix: "CON", label: "Fortitude" },
];

function generateRange(start: number, end: number, step: number): number[] {
  const out: number[] = [];
  for (let x = start; x <= end; x += step) out.push(x);
  return out;
}

function formatPercent(v: number): string {
  return `${v.toFixed(2)}%`;
}

function buildFormulaCurves(): FormulaCurve[] {
  return [
    {
      key: "evasion",
      title: "Evasion Curve (PvE)",
      xLabel: "Evasion",
      yLabel: "Chance (%)",
      points: generateRange(0, 4000, 50).map((x) => ({ x, y: (x / (x + 1000)) * 100 })),
    },
    {
      key: "critical",
      title: "Critical Chance Curve (PvE)",
      xLabel: "Critical Hit",
      yLabel: "Chance (%)",
      points: generateRange(0, 4000, 50).map((x) => ({ x, y: (x / (x + 1000)) * 100 })),
    },
    {
      key: "skill_boost",
      title: "Skill Damage Boost Curve",
      xLabel: "Skill Damage Boost",
      yLabel: "Result (%)",
      points: generateRange(0, 2000, 10).map((x) => ({ x, y: (x / (x + 1000)) * 100 })),
    },
    {
      key: "cooldown",
      title: "Cooldown Speed Curve",
      xLabel: "Cooldown Speed",
      yLabel: "Cooldown Reduction (%)",
      points: generateRange(0, 150, 1).map((x) => ({ x, y: (x / (x + 100)) * 100 })),
    },
    {
      key: "heavy",
      title: "Heavy Attack Chance Curve",
      xLabel: "Heavy Attack",
      yLabel: "Chance (%)",
      points: generateRange(0, 3000, 50).map((x) => ({ x, y: (x / (x + 1000)) * 100 })),
    },
    {
      key: "defense",
      title: "Damage Reduction Curve",
      xLabel: "Defense",
      yLabel: "Reduction (%)",
      points: generateRange(0, 6000, 50).map((x) => ({ x, y: (x / (x + 2500)) * 100 })),
    },
  ];
}

function parseFlatStats(raw: unknown): FlatStat[] {
  const rows = (raw as Array<{ Rows: Record<string, { Point: number; Type: string; Stat: Record<string, unknown> }> }>)[0]?.Rows;
  if (!rows) return [];

  const out: FlatStat[] = [];

  for (const entry of Object.values(rows)) {
    const point = entry.Point;
    const type = entry.Type;

    for (const [statName, value] of Object.entries(entry.Stat ?? {})) {
      if (value && typeof value === "object") {
        for (const [nested, nestedValue] of Object.entries(value as Record<string, number>)) {
          if (nestedValue !== 0) {
            out.push({ point, type, stat: `${statName}.${nested}`, value: nestedValue });
          }
        }
      } else if (typeof value === "number" && value !== 0) {
        out.push({ point, type, stat: statName, value });
      }
    }
  }

  return out;
}

function StatExplorer({
  label,
  data,
}: {
  label: string;
  data: FlatStat[];
}) {
  const uniqueStats = useMemo(
    () => [...new Set(data.map((d) => d.stat))].sort(),
    [data]
  );

  const [selectedStats, setSelectedStats] = useState<string[]>([]);

  const effectiveSelectedStats = useMemo(() => {
    const validSelected = selectedStats.filter((s) => uniqueStats.includes(s));
    if (validSelected.length > 0) return validSelected;
    return uniqueStats.slice(0, Math.min(4, uniqueStats.length));
  }, [selectedStats, uniqueStats]);

  const chartData = useMemo(() => {
    const byPoint = new Map<number, Record<string, number | string>>();

    for (const row of data) {
      if (!effectiveSelectedStats.includes(row.stat)) continue;
      if (!byPoint.has(row.point)) byPoint.set(row.point, { point: row.point });
      byPoint.get(row.point)![row.stat] = row.value;
    }

    return Array.from(byPoint.values()).sort((a, b) => Number(a.point) - Number(b.point));
  }, [data, effectiveSelectedStats]);

  const chartWidth = Math.max(720, chartData.length * 28);

  return (
    <section className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
      <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{label}</h2>

      <div className="mb-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
        {uniqueStats.map((stat) => {
          const active = effectiveSelectedStats.includes(stat);
          return (
            <button
              key={stat}
              onClick={() => {
                setSelectedStats((prev) => {
                  const base = prev.length > 0
                    ? prev.filter((s) => uniqueStats.includes(s))
                    : uniqueStats.slice(0, Math.min(4, uniqueStats.length));
                  if (base.includes(stat)) return base.filter((s) => s !== stat);
                  return [...base, stat];
                });
              }}
              className="text-xs px-2 py-1.5 rounded-lg border text-left"
              style={{
                borderColor: active ? "var(--accent)" : "var(--border)",
                background: active ? "var(--accent-glow)" : "var(--bg-secondary)",
                color: active ? "var(--accent-bright)" : "var(--text-secondary)",
              }}
            >
              {stat}
            </button>
          );
        })}
      </div>

      <div className="h-72 overflow-x-auto">
        <LineChart width={chartWidth} height={288} data={chartData} margin={{ top: 12, right: 16, bottom: 6, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis dataKey="point" stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
          <YAxis stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
          <Tooltip
            contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            labelStyle={{ color: "var(--text-primary)" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {effectiveSelectedStats.map((stat, idx) => (
            <Line
              key={stat}
              type="monotone"
              dataKey={stat}
              dot={false}
              strokeWidth={2}
              stroke={["#7a96ff", "#fbbf24", "#4ade80", "#f87171", "#a78bfa", "#22d3ee"][idx % 6]}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </div>
    </section>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<FlatStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formulaCurves = useMemo(() => buildFormulaCurves(), []);

  useEffect(() => {
    async function load() {
      try {
        const raw = await fetchGzJson("/data/TLBaseMainStat.gz");
        setStats(parseFlatStats(raw));
      } catch {
        setError("Unable to load TLBaseMainStat.gz from public/data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sectionData = useMemo(() => {
    const out: Record<string, FlatStat[]> = {};
    for (const section of STAT_SECTIONS) {
      out[section.suffix] = stats.filter((s) => s.type.endsWith(section.suffix));
    }
    return out;
  }, [stats]);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <Activity size={28} style={{ color: "var(--accent)" }} />
        Stats
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>
        Primary stat progression and common combat curves.
      </p>

      {loading && <div className="py-16 text-sm animate-pulse" style={{ color: "var(--text-muted)" }}>Loading stats…</div>}
      {error && <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--red)", color: "var(--red)", background: "var(--bg-card)" }}>⚠️ {error}</div>}

      {!loading && !error && (
        <div className="space-y-5">
          {STAT_SECTIONS.map((section) => (
            <StatExplorer
              key={section.suffix}
              label={section.label}
              data={sectionData[section.suffix] ?? []}
            />
          ))}
        </div>
      )}

      <section className="mt-8 rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Secondary Stat Curves</h2>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {formulaCurves.map((curve) => (
            <div key={curve.key} className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{curve.title}</h3>
              <div className="h-64 overflow-x-auto">
                <LineChart width={640} height={256} data={curve.points} margin={{ top: 10, right: 12, bottom: 4, left: 4 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="x"
                    stroke="var(--text-muted)"
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    label={{ value: curve.xLabel, fill: "var(--text-muted)", fontSize: 11, position: "insideBottom", offset: -4 }}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    domain={[0, 100]}
                    label={{ value: curve.yLabel, fill: "var(--text-muted)", fontSize: 11, angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    formatter={(value) => [formatPercent(Number(value)), curve.yLabel]}
                    labelFormatter={(label) => `${curve.xLabel}: ${label}`}
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                  <Line type="monotone" dataKey="y" stroke="#7a96ff" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border p-5 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)" }}>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>References</h2>
        <p>Source: Maxroll - in-depth stats guide.</p>
        <p>Source: community research shared on Reddit.</p>
      </section>
    </div>
  );
}




