import Link from "next/link";
import { Swords, Fish, Trophy, Calculator, Skull, ChevronRight, BookOpen, Users, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "TL Library — Home" };

type SectionConfig = {
  key: string;
  href: string;
  Icon: LucideIcon;
  color: string;
  badge?: string;
  title: string;
  desc: string;
};

const SECTIONS: SectionConfig[] = [
  { key: "fishing",      href: "/fishing",                 Icon: Fish,       color: "var(--green)",  badge: "Updated", title: "Fishing",               desc: "Fishing levels, fish and habitats." },
  { key: "achievements", href: "/achievements",            Icon: Trophy,     color: "var(--yellow)", badge: "Updated", title: "Achievements",          desc: "The complete list of achievements with icons." },
  { key: "articles",     href: "/articles",                Icon: BookOpen,   color: "var(--accent)",                title: "Articles",              desc: "Loot distribution rules and reference notes." },
  { key: "bestiary",     href: "/bestiary",                Icon: Skull,      color: "var(--red)",    badge: "New",   title: "3D Bestiary",           desc: "Explore game monsters with their animated 3D models." },
  { key: "calculator",   href: "/calculator/damage",       Icon: Calculator, color: "var(--accent)",                title: "Damage Calculator",     desc: "Calculate your damage, healing and DoTs in real time." },
  { key: "group_buffs",  href: "/calculator/group-buffs",  Icon: Users,      color: "var(--gold)",                  title: "Group Buff Calculator", desc: "Build parties and check min/max PvE buff coverage." },
  { key: "stats",        href: "/calculator/stats",          Icon: Calculator, color: "var(--accent)",                title: "Stats Calculator",      desc: "Explore base stat scaling and secondary formula curves." },
  { key: "weapons",      href: "/weapons/bow",             Icon: Swords,     color: "var(--gold)",                  title: "Weapons skills",        desc: "All skills sorted by weapon type." },
];

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="mb-12 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 border"
          style={{ background: "var(--accent-glow)", borderColor: "var(--border-bright)", color: "var(--accent-bright)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Throne &amp; Liberty — Data Library
        </div>
        <h1 className="text-5xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
          TL<span style={{ color: "var(--accent)" }}>Library</span>
        </h1>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map((s) => (
          <Link
            key={s.key}
            href={s.href}
            className="group rounded-2xl p-5 border flex flex-col gap-3 transition-all hover:scale-[1.02]"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}20`, color: s.color }}>
                <s.Icon size={24} />
              </div>
              <div className="flex items-center gap-2">
                {s.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--accent-glow)", color: "var(--accent-bright)" }}>
                    {s.badge}
                  </span>
                )}
                <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" style={{ color: "var(--text-muted)" }} />
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{s.title}</div>
              <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-4 rounded-xl border text-sm text-center"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
        Based on the work of{" "}
        <a href="https://github.com/Pnski/TLLib" target="_blank" rel="noreferrer"
          style={{ color: "var(--accent-bright)", textDecoration: "underline" }}>
          Pnski/TLLib
        </a>
        {" "} 🩵 - data extracted from Throne &amp; Liberty (AGS/NC).
      </div>
    </div>
  );
}
