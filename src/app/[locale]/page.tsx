import { useTranslations } from "next-intl";
import Link from "next/link";
import { Swords, Fish, Trophy, Calculator, Skull, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return { title: `TL Library — ${t("title")}` };
}

export default function HomePage() {
  const t = useTranslations("home");

  const SECTIONS = [
    { key: "bestiary",   href: "bestiary",           icon: <Skull size={24} />,      color: "var(--red)",    badge: t("sections.bestiary.badge") },
    { key: "calculator", href: "calculator/damage",  icon: <Calculator size={24} />, color: "var(--accent)", badge: undefined },
    { key: "weapons",    href: "weapons/bow",        icon: <Swords size={24} />,     color: "var(--gold)",   badge: undefined },
    { key: "achievements",href:"achievements",       icon: <Trophy size={24} />,     color: "var(--yellow)", badge: undefined },
    { key: "fishing",    href: "fishing",            icon: <Fish size={24} />,       color: "var(--green)",  badge: undefined },
  ] as const;

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
        <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          {t("subtitle")}
        </p>
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
                {s.icon}
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
              <div className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {t(`sections.${s.key}.title`)}
              </div>
              <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {t(`sections.${s.key}.desc`)}
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

