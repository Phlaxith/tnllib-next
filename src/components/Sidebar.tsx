"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Swords, Fish, Trophy, Calculator, BookOpen,
  ChevronDown, ChevronRight, Skull, Package
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";

type NavItem = {
  labelKey: string;
  href?: string;
  icon?: React.ReactNode;
  children?: NavItem[];
};

export default function Sidebar({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const base = `/${locale}`;

  const NAV: NavItem[] = [
    { labelKey: "home", href: `${base}/`, icon: <Home size={16} /> },
    { labelKey: "bestiary", href: `${base}/bestiary`, icon: <Skull size={16} /> },
    {
      labelKey: "items3d",
      icon: <Package size={16} />,
      children: [
        { labelKey: "itemsWeapons", href: `${base}/items/weapons` },
      ],
    },
    {
      labelKey: "tables",
      icon: <BookOpen size={16} />,
      children: [
        { labelKey: "achievements", href: `${base}/achievements`, icon: <Trophy size={16} /> },
        { labelKey: "fishing", href: `${base}/fishing`, icon: <Fish size={16} /> },
      ],
    },
    {
      labelKey: "weapons",
      icon: <Swords size={16} />,
      children: [
        { labelKey: "weaponMastery", href: `${base}/weapons/mastery` },
        { labelKey: "bow",           href: `${base}/weapons/bow` },
        { labelKey: "crossbow",      href: `${base}/weapons/crossbow` },
        { labelKey: "dagger",        href: `${base}/weapons/dagger` },
        { labelKey: "orb",           href: `${base}/weapons/orb` },
        { labelKey: "spear",         href: `${base}/weapons/spear` },
        { labelKey: "staff",         href: `${base}/weapons/staff` },
        { labelKey: "sword",         href: `${base}/weapons/sword` },
        { labelKey: "sword2h",       href: `${base}/weapons/sword2h` },
        { labelKey: "wand",          href: `${base}/weapons/wand` },
        { labelKey: "gauntlet",      href: `${base}/weapons/gauntlet` },
      ],
    },
    {
      labelKey: "calculators",
      icon: <Calculator size={16} />,
      children: [
        { labelKey: "calcDamage",     href: `${base}/calculator/damage` },
        { labelKey: "calcGroupBuffs", href: `${base}/calculator/group-buffs` },
      ],
    },
  ];

  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 flex flex-col border-r z-40"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://assets.playnccdn.com/common/tl.ico"
            alt="TL"
            width={28}
            height={28}
            className="rounded"
          />
          <div>
            <div className="font-bold text-base" style={{ color: "var(--text-primary)" }}>TL Library</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Thrones &amp; Liberty</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink key={item.href ?? item.labelKey} item={item} t={t} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
        <LanguageSwitcher currentLocale={locale} />
        <div className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          <a href="https://ko-fi.com/" target="_blank" rel="noreferrer">☕ Ko-fi</a>
          {" · "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">cc-by-sa-4.0</a>
        </div>
      </div>
    </aside>
  );
}

function NavLink({ item, t }: { item: NavItem; t: ReturnType<typeof useTranslations<"nav">> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const isActive = item.href ? pathname === item.href || (item.href.endsWith("/") && pathname === item.href.slice(0, -1)) : false;
  const label = t(item.labelKey as Parameters<typeof t>[0]);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <span style={{ color: "var(--accent)" }}>{item.icon}</span>
          <span className="flex-1 text-left">{label}</span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {open && (
          <div className="ml-6 mt-1 flex flex-col gap-0.5 border-l pl-3" style={{ borderColor: "var(--border)" }}>
            {item.children.map((child) => (
              <NavLink key={child.href ?? child.labelKey} item={child} t={t} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all")}
      style={{
        color: isActive ? "var(--accent-bright)" : "var(--text-secondary)",
        background: isActive ? "var(--accent-glow)" : "transparent",
        borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
      }}
    >
      {item.icon && <span style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}>{item.icon}</span>}
      {label}
    </Link>
  );
}



