import { useTranslations } from "next-intl";
import Link from "next/link";
import { Swords, Fish, Trophy, Calculator, Skull, ChevronRight, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return { title: `TL Library — ${t("title")}` };
}

// Static config: store Icon component references, not JSX elements
type SectionConfig = {
  key: string;
  href: string;
  Icon: LucideIcon;
  color: string;
  badgeKey?: string;
};

const SECTIONS: SectionConfig[] = [
  { key: "bestiary",    href: "bestiary",          Icon: Skull,      color: "var(--red)",    badgeKey: "sections.bestiary.badge" },
  { key: "calculator",  href: "calculator/damage", Icon: Calculator, color: "var(--accent)" },
  { key: "weapons",     href: "weapons/bow",        Icon: Swords,     color: "var(--gold)" },
  { key: "achievements",href: "achievements",       Icon: Trophy,     color: "var(--yellow)" },
  { key: "fishing",     href: "fishing",            Icon: Fish,       color: "var(--green)" },
];

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="mb-12 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 border"
          style={{ background: "var(--accent-glow)", borderColor: "var(--border-bright)", color: "var(--accent-bright)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          {t("badge")}
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
                {s.badgeKey && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--accent-glow)", color: "var(--accent-bright)" }}>
                    {t(s.badgeKey as Parameters<typeof t>[0])}
                  </span>
                )}
                <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" style={{ color: "var(--text-muted)" }} />
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {t(`sections.${s.key}.title` as Parameters<typeof t>[0])}
              </div>
              <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {t(`sections.${s.key}.desc` as Parameters<typeof t>[0])}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-4 rounded-xl border text-sm text-center"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
        {t("legal")}
      </div>
    </div>
  );
}

