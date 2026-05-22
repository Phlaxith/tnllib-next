"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Swords, Fish, Trophy, Calculator, BookOpen,
  ChevronDown, ChevronRight, Skull, Package,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";

type NavItem = {
  labelKey: string;
  href?: string;
  icon?: React.ReactNode;
  children?: NavItem[];
};

// Static navigation config — component references, no JSX, no runtime dependency
type NavConfig = {
  labelKey: string;
  hrefSuffix?: string;
  Icon?: LucideIcon;
  children?: NavConfig[];
};

const NAV_CONFIG: NavConfig[] = [
  { labelKey: "home",        hrefSuffix: "/",                    Icon: Home },
  { labelKey: "bestiary",    hrefSuffix: "/bestiary",             Icon: Skull },
  {
    labelKey: "items3d",
    Icon: Package,
    children: [
      { labelKey: "itemsWeapons", hrefSuffix: "/items/weapons" },
    ],
  },
  {
    labelKey: "tables",
    Icon: BookOpen,
    children: [
      { labelKey: "achievements", hrefSuffix: "/achievements", Icon: Trophy },
      { labelKey: "fishing",      hrefSuffix: "/fishing",      Icon: Fish },
    ],
  },
  {
    labelKey: "weapons",
    Icon: Swords,
    children: [
      { labelKey: "weaponMastery", hrefSuffix: "/weapons/mastery" },
      { labelKey: "bow",           hrefSuffix: "/weapons/bow" },
      { labelKey: "crossbow",      hrefSuffix: "/weapons/crossbow" },
      { labelKey: "dagger",        hrefSuffix: "/weapons/dagger" },
      { labelKey: "orb",           hrefSuffix: "/weapons/orb" },
      { labelKey: "spear",         hrefSuffix: "/weapons/spear" },
      { labelKey: "staff",         hrefSuffix: "/weapons/staff" },
      { labelKey: "sword",         hrefSuffix: "/weapons/sword" },
      { labelKey: "sword2h",       hrefSuffix: "/weapons/sword2h" },
      { labelKey: "wand",          hrefSuffix: "/weapons/wand" },
      { labelKey: "gauntlet",      hrefSuffix: "/weapons/gauntlet" },
    ],
  },
  {
    labelKey: "calculators",
    Icon: Calculator,
    children: [
      { labelKey: "calcDamage",     hrefSuffix: "/calculator/damage" },
      { labelKey: "calcGroupBuffs", hrefSuffix: "/calculator/group-buffs" },
    ],
  },
];

function buildNavItems(config: NavConfig[], base: string): NavItem[] {
  return config.map((item) => ({
    labelKey: item.labelKey,
    href:     item.hrefSuffix !== undefined ? `${base}${item.hrefSuffix}` : undefined,
    icon:     item.Icon ? <item.Icon size={16} /> : undefined,
    children: item.children ? buildNavItems(item.children, base) : undefined,
  }));
}

export default function Sidebar({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const base = `/${locale}`;

  // Rebuild NAV only when the locale changes
  const NAV = useMemo(() => buildNavItems(NAV_CONFIG, base), [base]);

  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 flex flex-col border-r z-40"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <Image
            src="https://assets.playnccdn.com/common/tl.ico"
            alt="TL"
            width={28}
            height={28}
            className="rounded"
            unoptimized
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
        <ThemeToggle />
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
  const isActive = item.href
    ? pathname === item.href || (item.href.endsWith("/") && pathname === item.href.slice(0, -1))
    : false;
  const label = t(item.labelKey as Parameters<typeof t>[0]);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
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
        background: isActive ? "var(--accent-glow)" : "transparent"
      }}
    >
      {item.icon && <span style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}>{item.icon}</span>}
      {label}
    </Link>
  );
}
